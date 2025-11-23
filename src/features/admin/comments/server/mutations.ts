"use server"

/**
 * CRUD Operations for Comments
 * 
 * Tất cả mutations đều sử dụng Zod validation và emit realtime notifications
 */

import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
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
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  type AuthContext,
} from "@/features/admin/resources/server"
import type { BulkActionResult } from "@/features/admin/resources/types"
import { emitCommentUpsert, emitCommentRemove, emitCommentBatchUpsert } from "./events"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }
export type { BulkActionResult }

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
  await logTableStatusAfterMutation({
    resource: "comments",
    action: action === "bulk-delete" ? "bulk-delete" : "bulk-restore",
    prismaModel: prisma.comment,
    affectedIds: commentIds,
    affectedCount: resultCount,
  })

  if (resultCount > 0) {
    try {
      await emitCommentBatchUpsert(commentIds, previousStatus)
    } catch (error) {
      logActionFlow("comments", action, "error", {
        error: error instanceof Error ? error.message : String(error),
        count: resultCount,
      })
    }

    try {
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
    } catch (error) {
      logActionFlow("comments", action, "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

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
  logActionFlow("comments", "update", "init", { commentId: id, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    logActionFlow("comments", "update", "error", { commentId: id, error: "ID bình luận không hợp lệ" }, startTime)
    throw new ApplicationError("ID bình luận không hợp lệ", 400)
  }

  const validatedInput = UpdateCommentSchema.parse(input)
  logActionFlow("comments", "update", "start", { commentId: id, changes: Object.keys(validatedInput) }, startTime)

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
    logActionFlow("comments", "update", "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
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

  if (Object.keys(updateData).length === 0) {
    logActionFlow("comments", "update", "success", { commentId: id, message: "Không có thay đổi" }, startTime)
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

  logActionFlow("comments", "update", "success", { commentId: sanitized.id, authorName: sanitized.authorName }, startTime)
  logDetailAction("comments", "update", sanitized.id, sanitized as unknown as Record<string, unknown>)

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
  logActionFlow("comments", action, "start", { commentId: id, actorId: ctx.actorId })

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
    logActionFlow("comments", action, "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại")
  }

  if (comment.approved === targetApproved) {
    logActionFlow("comments", action, "error", { 
      commentId: id, 
      error: targetApproved ? "Bình luận đã được duyệt" : "Bình luận chưa được duyệt" 
    }, startTime)
    throw new ApplicationError(
      targetApproved ? "Bình luận đã được duyệt" : "Bình luận chưa được duyệt",
      400
    )
  }

  await prisma.comment.update({
    where: { id },
    data: { approved: targetApproved },
  })

  const previousStatus: "active" | "deleted" = comment.deletedAt ? "deleted" : "active"
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

  logActionFlow("comments", action, "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", action, id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export async function approveComment(ctx: AuthContext, id: string): Promise<void> {
  await toggleCommentApproval(ctx, id, "approve")
}

export async function unapproveComment(ctx: AuthContext, id: string): Promise<void> {
  await toggleCommentApproval(ctx, id, "unapprove")
}

export async function softDeleteComment(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  logActionFlow("comments", "delete", "init", { commentId: id, actorId: ctx.actorId })

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
    logActionFlow("comments", "delete", "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại")
  }

  await prisma.comment.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  await logTableStatusAfterMutation({
    resource: "comments",
    action: "delete",
    prismaModel: prisma.comment,
    affectedIds: id,
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

  logActionFlow("comments", "delete", "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", "delete", id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export async function bulkSoftDeleteComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  logActionFlow("comments", "bulk-delete", "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_DELETE, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    logActionFlow("comments", "bulk-delete", "error", { error: "Danh sách bình luận trống" }, startTime)
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

    logActionFlow("comments", "bulk-delete", "error", {
      requestedCount: ids.length,
      foundCount: comments.length,
      allCommentsCount: allComments.length,
      alreadyDeletedCount,
      notFoundCount,
      error: "Không có bình luận nào có thể xóa",
    }, startTime)

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

  logActionFlow("comments", "bulk-delete", "success", { count: result.count, commentIds }, startTime)

  return { success: true, message, affected: result.count }
}

export async function restoreComment(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  logActionFlow("comments", "restore", "init", { commentId: id, actorId: ctx.actorId })

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
    logActionFlow("comments", "restore", "error", { commentId: id, error: "Bình luận không tồn tại hoặc chưa bị xóa" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại hoặc chưa bị xóa")
  }

  await prisma.comment.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  })

  await logTableStatusAfterMutation({
    resource: "comments",
    action: "restore",
    prismaModel: prisma.comment,
    affectedIds: id,
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

  logActionFlow("comments", "restore", "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", "restore", id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export async function bulkRestoreComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    logActionFlow("comments", "bulk-restore", "error", { error: "Danh sách bình luận trống" }, startTime)
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

  logActionFlow("comments", "bulk-restore", "start", {
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

    logActionFlow("comments", "bulk-restore", "error", {
      requestedCount: ids.length,
      foundCount: allRequestedComments.length,
      softDeletedCount: softDeletedComments.length,
      activeCount: activeComments.length,
      notFoundCount,
      error: errorMessage,
    }, startTime)

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

  logActionFlow("comments", "bulk-restore", "success", { count: result.count, commentIds }, startTime)

  return { success: true, message, affected: result.count }
}

export async function hardDeleteComment(ctx: AuthContext, id: string): Promise<void> {
  const startTime = Date.now()
  logActionFlow("comments", "hard-delete", "init", { commentId: id, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.COMMENTS_MANAGE])) {
    logActionFlow("comments", "hard-delete", "error", { commentId: id, error: "Không có quyền" }, startTime)
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
    logActionFlow("comments", "hard-delete", "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại")
  }

  if (!comment.deletedAt) {
    logActionFlow("comments", "hard-delete", "error", { commentId: id, error: "Chỉ có thể xóa vĩnh viễn bình luận đã bị xóa" }, startTime)
    throw new ApplicationError("Chỉ có thể xóa vĩnh viễn bình luận đã bị xóa", 400)
  }

  const previousStatus: "active" | "deleted" = comment.deletedAt ? "deleted" : "active"

  await prisma.comment.delete({ where: { id } })
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

  logActionFlow("comments", "hard-delete", "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", "hard-delete", id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export async function bulkHardDeleteComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  logActionFlow("comments", "bulk-hard-delete", "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.COMMENTS_MANAGE])) {
    logActionFlow("comments", "bulk-hard-delete", "error", { error: "Không có quyền" }, startTime)
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    logActionFlow("comments", "bulk-hard-delete", "error", { error: "Danh sách bình luận trống" }, startTime)
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
    logActionFlow("comments", "bulk-hard-delete", "error", { error: "Không tìm thấy bình luận nào để xóa vĩnh viễn" }, startTime)
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
    for (const comment of comments) {
      emitCommentRemove(comment.id, "deleted")
    }

    try {
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
    } catch (error) {
      logActionFlow("comments", "bulk-hard-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

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

  logActionFlow("comments", "bulk-hard-delete", "success", { count: result.count, commentIds }, startTime)

  return { success: true, message, affected: result.count }
}

export async function bulkApproveComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  logActionFlow("comments", "bulk-approve", "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    logActionFlow("comments", "bulk-approve", "error", { error: "Danh sách bình luận trống" }, startTime)
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
    logActionFlow("comments", "bulk-approve", "error", { error: "Không tìm thấy bình luận nào để duyệt" }, startTime)
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
    try {
      await emitCommentBatchUpsert(commentIds, "active")
    } catch (error) {
      logActionFlow("comments", "bulk-approve", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
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
    } catch (error) {
      logActionFlow("comments", "bulk-approve", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

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

  logActionFlow("comments", "bulk-approve", "success", { count: result.count, commentIds }, startTime)

  return { success: true, message, affected: result.count }
}

export async function bulkUnapproveComments(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  const startTime = Date.now()
  logActionFlow("comments", "bulk-unapprove", "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)

  if (!ids || ids.length === 0) {
    logActionFlow("comments", "bulk-unapprove", "error", { error: "Danh sách bình luận trống" }, startTime)
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
    logActionFlow("comments", "bulk-unapprove", "error", { error: "Không tìm thấy bình luận nào để hủy duyệt" }, startTime)
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
    try {
      await emitCommentBatchUpsert(commentIds, "active")
    } catch (error) {
      logActionFlow("comments", "bulk-unapprove", "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
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
    } catch (error) {
      logActionFlow("comments", "bulk-unapprove", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

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

  logActionFlow("comments", "bulk-unapprove", "success", { count: result.count, commentIds }, startTime)

  return { success: true, message, affected: result.count }
}

