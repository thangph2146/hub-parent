"use server"

/**
 * CRUD Operations for Comments
 * 
 * Tất cả mutations đều sử dụng Zod validation và emit realtime notifications
 */

import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { resourceLogger } from "@/lib/config"
import { mapCommentRecord, type CommentWithRelations } from "./helpers"
import type { ListedComment } from "../types"
import {
  UpdateCommentSchema,
  type UpdateCommentInput,
} from "./schemas"
import { notifySuperAdminsOfCommentAction, notifySuperAdminsOfBulkCommentAction, formatCommentNames } from "./notifications"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  invalidateResourceCache,
  invalidateResourceCacheBulk,
  type AuthContext,
} from "@/features/admin/resources/server"
import type { BulkActionResult } from "@/features/admin/resources/types"
import { emitCommentUpsert, emitCommentRemove, emitCommentBatchUpsert } from "./events"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }
export type { BulkActionResult }

/**
 * Helper function để log trạng thái hiện tại của table sau mutations
 */
async function logTableStatusAfterMutation(
  action: "after-delete" | "after-restore" | "after-bulk-delete" | "after-bulk-restore",
  affectedIds: string | string[],
  affectedCount?: number
): Promise<void> {
  const actionType = action.startsWith("after-bulk-") 
    ? (action === "after-bulk-delete" ? "bulk-delete" : "bulk-restore")
    : (action === "after-delete" ? "delete" : "restore")

  resourceLogger.actionFlow({
    resource: "comments",
    action: actionType,
    step: "start",
    metadata: { 
      loggingTableStatus: true, 
      affectedCount,
      affectedIds: Array.isArray(affectedIds) ? affectedIds.length : 1,
    },
  })

  const [activeCount, deletedCount] = await Promise.all([
    prisma.comment.count({ where: { deletedAt: null } }),
    prisma.comment.count({ where: { deletedAt: { not: null } } }),
  ])

  const isBulk = action.startsWith("after-bulk-")
  const structure = isBulk
    ? {
        action,
        deletedCount: action === "after-bulk-delete" ? affectedCount : undefined,
        restoredCount: action === "after-bulk-restore" ? affectedCount : undefined,
        currentActiveCount: activeCount,
        currentDeletedCount: deletedCount,
        affectedCommentIds: Array.isArray(affectedIds) ? affectedIds : [affectedIds],
        summary: action === "after-bulk-delete" 
          ? `Đã xóa ${affectedCount} bình luận. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`
          : `Đã khôi phục ${affectedCount} bình luận. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`,
      }
    : {
        action,
        currentActiveCount: activeCount,
        currentDeletedCount: deletedCount,
        affectedCommentId: typeof affectedIds === "string" ? affectedIds : affectedIds[0],
        summary: action === "after-delete"
          ? `Đã xóa 1 bình luận. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`
          : `Đã khôi phục 1 bình luận. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`,
      }

  resourceLogger.dataStructure({
    resource: "comments",
    dataType: "table",
    structure,
  })

  resourceLogger.actionFlow({
    resource: "comments",
    action: actionType,
    step: "success",
    metadata: {
      tableStatusLogged: true,
      activeCount,
      deletedCount,
      affectedCount,
      summary: structure.summary,
    },
  })
}

/**
 * Helper function để xử lý bulk operation sau khi update database
 * Bao gồm: log table status, emit socket events, send notifications, invalidate cache
 * Returns: success message với tên comments đã được format
 */
async function handleBulkOperationAfterUpdate(
  action: "bulk-delete" | "bulk-restore",
  commentIds: string[],
  comments: Array<{ id: string; content: string; author: { name: string | null; email: string }; post: { title: string } }>,
  resultCount: number,
  previousStatus: "active" | "deleted",
  ctx: AuthContext
): Promise<string> {
  // Log table status TRƯỚC khi invalidate cache để đảm bảo data đã được commit
  await logTableStatusAfterMutation(
    action === "bulk-delete" ? "after-bulk-delete" : "after-bulk-restore",
    commentIds,
    resultCount
  )

  if (resultCount > 0) {
    resourceLogger.socket({
      resource: "comments",
      action,
      event: "comment:batch-upsert",
      resourceId: commentIds.join(","),
      payload: { commentIds, previousStatus },
    })
    await emitCommentBatchUpsert(commentIds, previousStatus)

    await notifySuperAdminsOfBulkCommentAction(
      action === "bulk-delete" ? "delete" : "restore",
      ctx.actorId,
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorName: c.author.name,
        authorEmail: c.author.email,
        postTitle: c.post.title,
      }))
    )
  }

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate-bulk",
    tags: ["comments", "active-comments", "deleted-comments"],
  })
  await invalidateResourceCacheBulk({
    resource: "comments",
    additionalTags: ["active-comments", "deleted-comments"],
  })

  // Tạo success message với tên comments đã được format
  const namesText = comments.length > 0 ? formatCommentNames(
    comments.map((c) => ({
      authorName: c.author.name,
      authorEmail: c.author.email,
      content: c.content,
    })),
    3
  ) : ""
  const actionText = action === "bulk-delete" ? "xóa" : "khôi phục"
  return namesText
    ? `Đã ${actionText} ${resultCount} bình luận: ${namesText}`
    : `Đã ${actionText} ${resultCount} bình luận`
}

export async function updateComment(ctx: AuthContext, id: string, input: UpdateCommentInput): Promise<ListedComment> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "update",
    step: "start",
    metadata: { commentId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "update",
      step: "error",
      metadata: { commentId: id, error: "ID bình luận không hợp lệ" },
    })
    throw new ApplicationError("ID bình luận không hợp lệ", 400)
  }

  // Validate input với zod
  const validatedInput = UpdateCommentSchema.parse(input)

  const existing = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!existing || existing.deletedAt) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "update",
      step: "error",
      metadata: { commentId: id, error: "Bình luận không tồn tại" },
    })
    throw new NotFoundError("Bình luận không tồn tại")
  }

  // Track changes for notification
  const changes: {
    content?: { old: string; new: string }
    approved?: { old: boolean; new: boolean }
  } = {}

  const updateData: {
    content?: string
    approved?: boolean
  } = {}

  if (validatedInput.content !== undefined) {
    const trimmedContent = validatedInput.content.trim()
    if (trimmedContent !== existing.content) {
      changes.content = { old: existing.content, new: trimmedContent }
    }
    updateData.content = trimmedContent
  }

  if (validatedInput.approved !== undefined) {
    if (validatedInput.approved !== existing.approved) {
      changes.approved = { old: existing.approved, new: validatedInput.approved }
    }
    updateData.approved = validatedInput.approved
  }

  // Chỉ update nếu có thay đổi
  if (Object.keys(updateData).length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "update",
      step: "success",
      duration: Date.now() - startTime,
      metadata: { commentId: id, message: "Không có thay đổi" },
    })
    return mapCommentRecord(existing)
  }

  const comment = await prisma.comment.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  const sanitized = mapCommentRecord(comment)

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: sanitized.id,
    tags: ["comments", `comment-${sanitized.id}`, "active-comments", "deleted-comments"],
  })
  await invalidateResourceCache({
    resource: "comments",
    id: sanitized.id,
    additionalTags: ["active-comments", "deleted-comments"],
  })

  resourceLogger.socket({
    resource: "comments",
    action: "update",
    event: "comment:upsert",
    resourceId: sanitized.id,
    payload: { commentId: sanitized.id, previousStatus: existing.deletedAt ? "deleted" : "active" },
  })
  await emitCommentUpsert(comment.id, existing.deletedAt ? "deleted" : "active")

  await notifySuperAdminsOfCommentAction(
    "update",
    ctx.actorId,
    {
      id: sanitized.id,
      content: sanitized.content,
      authorName: sanitized.authorName,
      authorEmail: sanitized.authorEmail,
      postTitle: sanitized.postTitle,
    },
    Object.keys(changes).length > 0 ? changes : undefined
  )

  resourceLogger.actionFlow({
    resource: "comments",
    action: "update",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { commentId: sanitized.id, authorName: sanitized.authorName },
  })

  resourceLogger.detailAction({
    resource: "comments",
    action: "update",
    resourceId: sanitized.id,
    authorName: sanitized.authorName,
    postTitle: sanitized.postTitle,
  })

  return sanitized
}

/**
 * Helper function để xử lý approve/unapprove comment
 */
async function toggleCommentApproval(
  ctx: AuthContext,
  id: string,
  action: "approve" | "unapprove"
): Promise<void> {
  const startTime = Date.now()
  const targetApproved = action === "approve"

  resourceLogger.actionFlow({
    resource: "comments",
    action,
    step: "start",
    metadata: { commentId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!comment || comment.deletedAt) {
    resourceLogger.actionFlow({
      resource: "comments",
      action,
      step: "error",
      metadata: { commentId: id, error: "Bình luận không tồn tại" },
    })
    throw new NotFoundError("Bình luận không tồn tại")
  }

  if (comment.approved === targetApproved) {
    resourceLogger.actionFlow({
      resource: "comments",
      action,
      step: "error",
      metadata: { 
        commentId: id, 
        error: targetApproved ? "Bình luận đã được duyệt" : "Bình luận chưa được duyệt" 
      },
    })
    throw new ApplicationError(
      targetApproved ? "Bình luận đã được duyệt" : "Bình luận chưa được duyệt",
      400
    )
  }

  await prisma.comment.update({
    where: { id },
    data: { approved: targetApproved },
  })

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["comments", `comment-${id}`, "active-comments", "deleted-comments"],
  })
  await invalidateResourceCache({
    resource: "comments",
    id,
    additionalTags: ["active-comments", "deleted-comments"],
  })

  const previousStatus: "active" | "deleted" = comment.deletedAt ? "deleted" : "active"
  resourceLogger.socket({
    resource: "comments",
    action,
    event: "comment:upsert",
    resourceId: id,
    payload: { commentId: id, previousStatus },
  })
  await emitCommentUpsert(comment.id, previousStatus)

  await notifySuperAdminsOfCommentAction(
    action,
    ctx.actorId,
    {
      id: comment.id,
      content: comment.content,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
    }
  )

  resourceLogger.actionFlow({
    resource: "comments",
    action,
    step: "success",
    duration: Date.now() - startTime,
    metadata: { commentId: id, authorName: comment.author.name },
  })

  resourceLogger.detailAction({
    resource: "comments",
    action,
    resourceId: id,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  })
}

export async function approveComment(ctx: AuthContext, id: string): Promise<void> {
  await toggleCommentApproval(ctx, id, "approve")
}

export async function unapproveComment(ctx: AuthContext, id: string): Promise<void> {
  await toggleCommentApproval(ctx, id, "unapprove")
}

export async function softDeleteComment(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "delete",
    step: "start",
    metadata: { commentId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_DELETE, PERMISSIONS.COMMENTS_MANAGE)

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!comment || comment.deletedAt) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "delete",
      step: "error",
      metadata: { commentId: id, error: "Bình luận không tồn tại" },
    })
    throw new NotFoundError("Bình luận không tồn tại")
  }

  await prisma.comment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  // Log table status TRƯỚC khi invalidate cache để đảm bảo data đã được commit
  await logTableStatusAfterMutation("after-delete", id)

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["comments", `comment-${id}`, "active-comments", "deleted-comments"],
  })
  await invalidateResourceCache({
    resource: "comments",
    id,
    additionalTags: ["active-comments", "deleted-comments"],
  })

  resourceLogger.socket({
    resource: "comments",
    action: "delete",
    event: "comment:upsert",
    resourceId: id,
    payload: { commentId: id, previousStatus: "active" },
  })
  await emitCommentUpsert(comment.id, "active")

  await notifySuperAdminsOfCommentAction(
    "delete",
    ctx.actorId,
    {
      id: comment.id,
      content: comment.content,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
    }
  )

  resourceLogger.actionFlow({
    resource: "comments",
    action: "delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { commentId: id, authorName: comment.author.name },
  })
}

export async function bulkSoftDeleteComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-delete",
    step: "start",
    metadata: { count: ids.length, commentIds: ids, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_DELETE, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-delete",
      step: "error",
      metadata: { error: "Danh sách bình luận trống" },
    })
    throw new ApplicationError("Danh sách bình luận trống", 400)
  }

  // Lấy thông tin comments trước khi delete để tạo notifications
  const comments = await prisma.comment.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  // Nếu không tìm thấy comment nào, kiểm tra lý do và trả về error message chi tiết
  if (comments.length === 0) {
    const allComments = await prisma.comment.findMany({
      where: { id: { in: ids } },
      select: { id: true, content: true, deletedAt: true },
    })
    const alreadyDeletedComments = allComments.filter((c) => c.deletedAt !== null && c.deletedAt !== undefined)
    const alreadyDeletedCount = alreadyDeletedComments.length
    const notFoundCount = ids.length - allComments.length

    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-delete",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: comments.length,
        allCommentsCount: allComments.length,
        alreadyDeletedCount,
        notFoundCount,
        error: "Không có bình luận nào có thể xóa",
      },
    })

    let errorMessage = "Không có bình luận nào có thể xóa"
    const parts: string[] = []
    if (alreadyDeletedCount > 0) {
      const commentPreviews = alreadyDeletedComments.slice(0, 3).map((c) => {
        const preview = c.content.length > 30 ? `${c.content.substring(0, 30)}...` : c.content
        return `"${preview}"`
      }).join(", ")
      const moreCount = alreadyDeletedCount > 3 ? ` và ${alreadyDeletedCount - 3} bình luận khác` : ""
      parts.push(`${alreadyDeletedCount} bình luận đã bị xóa trước đó: ${commentPreviews}${moreCount}`)
    }
    if (notFoundCount > 0) {
      parts.push(`${notFoundCount} bình luận không tồn tại`)
    }

    if (parts.length > 0) {
      errorMessage += ` (${parts.join(", ")})`
    }

    throw new ApplicationError(errorMessage, 400)
  }

  const result = await prisma.comment.updateMany({
    where: {
      id: { in: comments.map((c) => c.id) },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  const commentIds = comments.map((c) => c.id)

  const message = await handleBulkOperationAfterUpdate("bulk-delete", commentIds, comments, result.count, "active", ctx)

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { count: result.count, commentIds },
  })

  return { success: true, message, affected: result.count }
}

export async function restoreComment(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "restore",
    step: "start",
    metadata: { commentId: id, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!comment || !comment.deletedAt) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "restore",
      step: "error",
      metadata: { commentId: id, error: "Bình luận không tồn tại hoặc chưa bị xóa" },
    })
    throw new NotFoundError("Bình luận không tồn tại hoặc chưa bị xóa")
  }

  await prisma.comment.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  })

  // Log table status TRƯỚC khi invalidate cache để đảm bảo data đã được commit
  await logTableStatusAfterMutation("after-restore", id)

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["comments", `comment-${id}`, "active-comments", "deleted-comments"],
  })
  await invalidateResourceCache({
    resource: "comments",
    id,
    additionalTags: ["active-comments", "deleted-comments"],
  })

  resourceLogger.socket({
    resource: "comments",
    action: "restore",
    event: "comment:upsert",
    resourceId: id,
    payload: { commentId: id, previousStatus: "deleted" },
  })
  await emitCommentUpsert(comment.id, "deleted")

  await notifySuperAdminsOfCommentAction(
    "restore",
    ctx.actorId,
    {
      id: comment.id,
      content: comment.content,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
    }
  )

  resourceLogger.actionFlow({
    resource: "comments",
    action: "restore",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { commentId: id, authorName: comment.author.name },
  })
}

export async function bulkRestoreComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-restore",
      step: "error",
      metadata: { error: "Danh sách bình luận trống" },
    })
    throw new ApplicationError("Danh sách bình luận trống", 400)
  }

  // Tìm tất cả comments được request để phân loại trạng thái
  const allRequestedComments = await prisma.comment.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, deletedAt: true },
  })

  // Phân loại comments
  const softDeletedComments = allRequestedComments.filter((comment) => {
    const isDeleted = comment.deletedAt !== null && comment.deletedAt !== undefined
    return isDeleted
  })
  const activeComments = allRequestedComments.filter((comment) => {
    const isActive = comment.deletedAt === null || comment.deletedAt === undefined
    return isActive
  })
  const notFoundCount = ids.length - allRequestedComments.length
  const foundIds = allRequestedComments.map((c) => c.id)
  const notFoundIds = ids.filter((id) => !foundIds.includes(id))
  const softDeletedIds = softDeletedComments.map((c) => c.id)
  const activeIds = activeComments.map((c) => c.id)

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-restore",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: allRequestedComments.length,
      softDeletedCount: softDeletedComments.length,
      activeCount: activeComments.length,
      notFoundCount,
      requestedIds: ids,
      foundIds,
      softDeletedIds,
      activeIds,
      notFoundIds,
      actorId: ctx.actorId,
    },
  })

  // Nếu không có comment nào đã bị soft delete, throw error với message chi tiết
  if (softDeletedComments.length === 0) {
    const parts: string[] = []
    if (activeComments.length > 0) {
      parts.push(`${activeComments.length} bình luận đang hoạt động`)
    }
    if (notFoundCount > 0) {
      parts.push(`${notFoundCount} bình luận không tồn tại (đã bị xóa vĩnh viễn)`)
    }

    const errorMessage = parts.length > 0
      ? `Không có bình luận nào để khôi phục (${parts.join(", ")})`
      : `Không tìm thấy bình luận nào để khôi phục`

    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-restore",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: allRequestedComments.length,
        softDeletedCount: softDeletedComments.length,
        activeCount: activeComments.length,
        notFoundCount,
        error: errorMessage,
      },
    })

    throw new ApplicationError(errorMessage, 400)
  }

  // Lấy thông tin đầy đủ của comments để restore (chỉ soft-deleted)
  const comments = await prisma.comment.findMany({
    where: {
      id: { in: softDeletedIds },
      deletedAt: { not: null },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  const result = await prisma.comment.updateMany({
    where: {
      id: { in: comments.map((c) => c.id) },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
    },
  })

  const commentIds = comments.map((c) => c.id)

  const message = await handleBulkOperationAfterUpdate("bulk-restore", commentIds, comments, result.count, "deleted", ctx)

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-restore",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { count: result.count, commentIds },
  })

  return { success: true, message, affected: result.count }
}

export async function hardDeleteComment(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "hard-delete",
    step: "start",
    metadata: { commentId: id, actorId: ctx.actorId },
  })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.COMMENTS_MANAGE])) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "hard-delete",
      step: "error",
      metadata: { commentId: id, error: "Không có quyền" },
    })
    throw new ForbiddenError()
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!comment) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "hard-delete",
      step: "error",
      metadata: { commentId: id, error: "Bình luận không tồn tại" },
    })
    throw new NotFoundError("Bình luận không tồn tại")
  }

  // Chỉ cho phép hard delete khi comment đã bị soft delete
  if (!comment.deletedAt) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "hard-delete",
      step: "error",
      metadata: { commentId: id, error: "Chỉ có thể xóa vĩnh viễn bình luận đã bị xóa" },
    })
    throw new ApplicationError("Chỉ có thể xóa vĩnh viễn bình luận đã bị xóa", 400)
  }

  const previousStatus: "active" | "deleted" = comment.deletedAt ? "deleted" : "active"

  await prisma.comment.delete({
    where: { id },
  })

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate",
    resourceId: id,
    tags: ["comments", `comment-${id}`, "active-comments", "deleted-comments"],
  })
  await invalidateResourceCache({
    resource: "comments",
    id,
    additionalTags: ["active-comments", "deleted-comments"],
  })

  resourceLogger.socket({
    resource: "comments",
    action: "hard-delete",
    event: "comment:remove",
    resourceId: id,
    payload: { commentId: id, previousStatus },
  })
  emitCommentRemove(comment.id, previousStatus)

  await notifySuperAdminsOfCommentAction(
    "hard-delete",
    ctx.actorId,
    {
      id: comment.id,
      content: comment.content,
      authorName: comment.author.name,
      authorEmail: comment.author.email,
      postTitle: comment.post.title,
    }
  )

  resourceLogger.actionFlow({
    resource: "comments",
    action: "hard-delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { commentId: id, authorName: comment.author.name },
  })
}

export async function bulkHardDeleteComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-hard-delete",
    step: "start",
    metadata: { count: ids.length, commentIds: ids, actorId: ctx.actorId },
  })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.COMMENTS_MANAGE])) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-hard-delete",
      step: "error",
      metadata: { error: "Không có quyền" },
    })
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-hard-delete",
      step: "error",
      metadata: { error: "Danh sách bình luận trống" },
    })
    throw new ApplicationError("Danh sách bình luận trống", 400)
  }

  // Lấy thông tin comments trước khi delete để tạo notifications
  // Chỉ lấy các comments đã bị soft delete
  const comments = await prisma.comment.findMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (comments.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-hard-delete",
      step: "error",
      metadata: { error: "Không tìm thấy bình luận nào để xóa vĩnh viễn" },
    })
    throw new ApplicationError("Không tìm thấy bình luận nào để xóa vĩnh viễn", 400)
  }

  const result = await prisma.comment.deleteMany({
    where: {
      id: { in: comments.map((c) => c.id) },
      deletedAt: { not: null },
    },
  })

  const commentIds = comments.map((c) => c.id)

  if (result.count > 0) {
    // Emit events (emitCommentRemove trả về void, không phải Promise)
    for (const comment of comments) {
      resourceLogger.socket({
        resource: "comments",
        action: "bulk-hard-delete",
        event: "comment:remove",
        resourceId: comment.id,
        payload: { commentId: comment.id, previousStatus: "deleted" },
      })
      emitCommentRemove(comment.id, "deleted")
    }

    await notifySuperAdminsOfBulkCommentAction(
      "hard-delete",
      ctx.actorId,
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorName: c.author.name,
        authorEmail: c.author.email,
        postTitle: c.post.title,
      }))
    )
  }

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate-bulk",
    tags: ["comments", "active-comments", "deleted-comments"],
  })
  await invalidateResourceCacheBulk({
    resource: "comments",
    additionalTags: ["active-comments", "deleted-comments"],
  })

  const namesText = comments.length > 0 ? formatCommentNames(
    comments.map((c) => ({
      authorName: c.author.name,
      authorEmail: c.author.email,
      content: c.content,
    })),
    3
  ) : ""
  const message = namesText
    ? `Đã xóa vĩnh viễn ${result.count} bình luận: ${namesText}`
    : `Đã xóa vĩnh viễn ${result.count} bình luận`

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-hard-delete",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { count: result.count, commentIds },
  })

  return { success: true, message, affected: result.count }
}

export async function bulkApproveComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-approve",
    step: "start",
    metadata: { count: ids.length, commentIds: ids, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-approve",
      step: "error",
      metadata: { error: "Danh sách bình luận trống" },
    })
    throw new ApplicationError("Danh sách bình luận trống", 400)
  }

  // Lấy thông tin comments trước khi approve để tạo notifications
  const comments = await prisma.comment.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      approved: false,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (comments.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-approve",
      step: "error",
      metadata: { error: "Không tìm thấy bình luận nào để duyệt" },
    })
    throw new ApplicationError("Không tìm thấy bình luận nào để duyệt", 400)
  }

  const result = await prisma.comment.updateMany({
    where: {
      id: { in: comments.map((c) => c.id) },
      deletedAt: null,
      approved: false,
    },
    data: {
      approved: true,
    },
  })

  const commentIds = comments.map((c) => c.id)

  if (result.count > 0) {
    resourceLogger.socket({
      resource: "comments",
      action: "bulk-approve",
      event: "comment:batch-upsert",
      resourceId: commentIds.join(","),
      payload: { commentIds, previousStatus: "active" },
    })
    await emitCommentBatchUpsert(commentIds, "active")

    await notifySuperAdminsOfBulkCommentAction(
      "approve",
      ctx.actorId,
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorName: c.author.name,
        authorEmail: c.author.email,
        postTitle: c.post.title,
      }))
    )
  }

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate-bulk",
    tags: ["comments", "active-comments", "deleted-comments"],
  })
  await invalidateResourceCacheBulk({
    resource: "comments",
    additionalTags: ["active-comments", "deleted-comments"],
  })

  const namesText = comments.length > 0 ? formatCommentNames(
    comments.map((c) => ({
      authorName: c.author.name,
      authorEmail: c.author.email,
      content: c.content,
    })),
    3
  ) : ""
  const message = namesText
    ? `Đã duyệt ${result.count} bình luận: ${namesText}`
    : `Đã duyệt ${result.count} bình luận`

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-approve",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { count: result.count, commentIds },
  })

  return { success: true, message, affected: result.count }
}

export async function bulkUnapproveComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-unapprove",
    step: "start",
    metadata: { count: ids.length, commentIds: ids, actorId: ctx.actorId },
  })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-unapprove",
      step: "error",
      metadata: { error: "Danh sách bình luận trống" },
    })
    throw new ApplicationError("Danh sách bình luận trống", 400)
  }

  // Lấy thông tin comments trước khi unapprove để tạo notifications
  const comments = await prisma.comment.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
      approved: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (comments.length === 0) {
    resourceLogger.actionFlow({
      resource: "comments",
      action: "bulk-unapprove",
      step: "error",
      metadata: { error: "Không tìm thấy bình luận nào để hủy duyệt" },
    })
    throw new ApplicationError("Không tìm thấy bình luận nào để hủy duyệt", 400)
  }

  const result = await prisma.comment.updateMany({
    where: {
      id: { in: comments.map((c) => c.id) },
      deletedAt: null,
      approved: true,
    },
    data: {
      approved: false,
    },
  })

  const commentIds = comments.map((c) => c.id)

  if (result.count > 0) {
    resourceLogger.socket({
      resource: "comments",
      action: "bulk-unapprove",
      event: "comment:batch-upsert",
      resourceId: commentIds.join(","),
      payload: { commentIds, previousStatus: "active" },
    })
    await emitCommentBatchUpsert(commentIds, "active")

    await notifySuperAdminsOfBulkCommentAction(
      "unapprove",
      ctx.actorId,
      comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorName: c.author.name,
        authorEmail: c.author.email,
        postTitle: c.post.title,
      }))
    )
  }

  resourceLogger.cache({
    resource: "comments",
    action: "cache-invalidate",
    operation: "invalidate-bulk",
    tags: ["comments", "active-comments", "deleted-comments"],
  })
  await invalidateResourceCacheBulk({
    resource: "comments",
    additionalTags: ["active-comments", "deleted-comments"],
  })

  const namesText = comments.length > 0 ? formatCommentNames(
    comments.map((c) => ({
      authorName: c.author.name,
      authorEmail: c.author.email,
      content: c.content,
    })),
    3
  ) : ""
  const message = namesText
    ? `Đã hủy duyệt ${result.count} bình luận: ${namesText}`
    : `Đã hủy duyệt ${result.count} bình luận`

  resourceLogger.actionFlow({
    resource: "comments",
    action: "bulk-unapprove",
    step: "success",
    duration: Date.now() - startTime,
    metadata: { count: result.count, commentIds },
  })

  return { success: true, message, affected: result.count }
}

