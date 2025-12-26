"use server"

import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { mapCommentRecord } from "./helpers"
import type { ListedComment } from "../types"
import { UpdateCommentSchema, type UpdateCommentInput } from "./schemas"
import { notifySuperAdminsOfCommentAction, notifySuperAdminsOfBulkCommentAction, formatCommentNames } from "./notifications"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  buildBulkError,
  validateBulkIds,
  type AuthContext,
} from "@/features/admin/resources/server"
import type { BulkActionResult } from "@/features/admin/resources/types"
import { emitCommentUpsert, emitCommentRemove, emitCommentBatchUpsert } from "./events"

export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }
export type { BulkActionResult }

type CommentWithRelations = {
  id: string
  content: string
  author: { name: string | null; email: string }
  post: { title: string }
}

const COMMENT_INCLUDE = {
  author: { select: { id: true, name: true, email: true } },
  post: { select: { id: true, title: true } },
} as const

const getCommentWithRelations = (id: string) =>
  prisma.comment.findUnique({ where: { id }, include: COMMENT_INCLUDE })

const mapCommentForNotification = (c: CommentWithRelations) => ({
  id: c.id,
  content: c.content,
  authorName: c.author.name,
  authorEmail: c.author.email,
  postTitle: c.post.title,
})

const handleBulkOperationAfterUpdate = async (
  action: "bulk-delete" | "bulk-restore",
  commentIds: string[],
  comments: CommentWithRelations[],
  resultCount: number,
  previousStatus: "active" | "deleted",
  ctx: AuthContext
): Promise<string> => {
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
        comments.map(mapCommentForNotification)
      )
    } catch (error) {
      logActionFlow("comments", action, "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

  const namesText = comments.length > 0
    ? formatCommentNames(comments.map((c) => ({ authorName: c.author.name, authorEmail: c.author.email, content: c.content })), 3)
    : ""
  const actionText = action === "bulk-delete" ? "xóa" : "khôi phục"
  return namesText ? `Đã ${actionText} ${resultCount} bình luận: ${namesText}` : `Đã ${actionText} ${resultCount} bình luận`
}

export const updateComment = async (ctx: AuthContext, id: string, input: UpdateCommentInput): Promise<ListedComment> => {
  const startTime = Date.now()
  logActionFlow("comments", "update", "init", { commentId: id, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  if (!id?.trim()) {
    logActionFlow("comments", "update", "error", { commentId: id, error: "ID bình luận không hợp lệ" }, startTime)
    throw new ApplicationError("ID bình luận không hợp lệ", 400)
  }

  const validatedInput = UpdateCommentSchema.parse(input)
  logActionFlow("comments", "update", "start", { commentId: id, changes: Object.keys(validatedInput) }, startTime)

  const existing = await getCommentWithRelations(id)
  if (!existing || existing.deletedAt) {
    logActionFlow("comments", "update", "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại")
  }

  const changes: { content?: { old: string; new: string }; approved?: { old: boolean; new: boolean } } = {}
  const updateData: { content?: string; approved?: boolean } = {}

  if (validatedInput.content !== undefined) {
    const trimmedContent = validatedInput.content.trim()
    if (trimmedContent !== existing.content) changes.content = { old: existing.content, new: trimmedContent }
    updateData.content = trimmedContent
  }

  if (validatedInput.approved !== undefined) {
    if (validatedInput.approved !== existing.approved) changes.approved = { old: existing.approved, new: validatedInput.approved }
    updateData.approved = validatedInput.approved
  }

  if (Object.keys(updateData).length === 0) {
    logActionFlow("comments", "update", "success", { commentId: id, message: "Không có thay đổi" }, startTime)
    return mapCommentRecord(existing)
  }

  const comment = await prisma.comment.update({ where: { id }, data: updateData, include: COMMENT_INCLUDE })
  const sanitized = mapCommentRecord(comment)
  await emitCommentUpsert(comment.id, existing.deletedAt ? "deleted" : "active")

  await notifySuperAdminsOfCommentAction("update", ctx.actorId, mapCommentForNotification(comment), Object.keys(changes).length > 0 ? changes : undefined)

  logActionFlow("comments", "update", "success", { commentId: sanitized.id, authorName: sanitized.authorName }, startTime)
  logDetailAction("comments", "update", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

const toggleCommentApproval = async (ctx: AuthContext, id: string, action: "approve" | "unapprove"): Promise<void> => {
  const startTime = Date.now()
  const targetApproved = action === "approve"
  logActionFlow("comments", action, "start", { commentId: id, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)

  const comment = await getCommentWithRelations(id)
  if (!comment || comment.deletedAt) {
    logActionFlow("comments", action, "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại")
  }

  if (comment.approved === targetApproved) {
    const errorMsg = targetApproved ? "Bình luận đã được duyệt" : "Bình luận chưa được duyệt"
    logActionFlow("comments", action, "error", { commentId: id, error: errorMsg }, startTime)
    throw new ApplicationError(errorMsg, 400)
  }

  await prisma.comment.update({ where: { id }, data: { approved: targetApproved } })

  const previousStatus: "active" | "deleted" = comment.deletedAt ? "deleted" : "active"
  await emitCommentUpsert(comment.id, previousStatus)
  await notifySuperAdminsOfCommentAction(action, ctx.actorId, mapCommentForNotification(comment))

  logActionFlow("comments", action, "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", action, id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export const approveComment = async (ctx: AuthContext, id: string): Promise<void> => toggleCommentApproval(ctx, id, "approve")
export const unapproveComment = async (ctx: AuthContext, id: string): Promise<void> => toggleCommentApproval(ctx, id, "unapprove")

export const softDeleteComment = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("comments", "delete", "init", { commentId: id, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_DELETE, PERMISSIONS.COMMENTS_MANAGE)

  const comment = await getCommentWithRelations(id)
  if (!comment || comment.deletedAt) {
    logActionFlow("comments", "delete", "error", { commentId: id, error: "Bình luận không tồn tại" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại")
  }

  await prisma.comment.update({ where: { id }, data: { deletedAt: new Date() } })
  await logTableStatusAfterMutation({ resource: "comments", action: "delete", prismaModel: prisma.comment, affectedIds: id })
  await emitCommentUpsert(comment.id, "active")
  await notifySuperAdminsOfCommentAction("delete", ctx.actorId, mapCommentForNotification(comment))

  logActionFlow("comments", "delete", "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", "delete", id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export const bulkSoftDeleteComments = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("comments", "bulk-delete", "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_DELETE, PERMISSIONS.COMMENTS_MANAGE)
  validateBulkIds(ids, "bình luận")

  const comments = await prisma.comment.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: COMMENT_INCLUDE,
  })

  if (comments.length === 0) {
    const allComments = await prisma.comment.findMany({
      where: { id: { in: ids } },
      select: { id: true, content: true, deletedAt: true },
    })
    logActionFlow("comments", "bulk-delete", "error", {
      requestedCount: ids.length,
      foundCount: comments.length,
      allCommentsCount: allComments.length,
      error: "Không có bình luận nào có thể xóa",
    }, startTime)
    throw new ApplicationError(
      buildBulkError(allComments, ids, "bình luận", {
        getPreview: (item) => {
          const content = item.content as string | undefined
          if (content && content.length > 30) {
            return `"${content.substring(0, 30)}..."`
          }
          return content ? `"${content}"` : ""
        },
      }),
      400
    )
  }

  const result = await prisma.comment.updateMany({
    where: { id: { in: comments.map((c) => c.id) }, deletedAt: null },
    data: { deletedAt: new Date() },
  })

  const commentIds = comments.map((c) => c.id)
  const message = await handleBulkOperationAfterUpdate("bulk-delete", commentIds, comments, result.count, "active", ctx)

  logActionFlow("comments", "bulk-delete", "success", { count: result.count, commentIds }, startTime)
  return { success: true, message, affected: result.count }
}

export const restoreComment = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("comments", "restore", "init", { commentId: id, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)

  const comment = await getCommentWithRelations(id)
  if (!comment || !comment.deletedAt) {
    logActionFlow("comments", "restore", "error", { commentId: id, error: "Bình luận không tồn tại hoặc chưa bị xóa" }, startTime)
    throw new NotFoundError("Bình luận không tồn tại hoặc chưa bị xóa")
  }

  await prisma.comment.update({ where: { id }, data: { deletedAt: null } })
  await logTableStatusAfterMutation({ resource: "comments", action: "restore", prismaModel: prisma.comment, affectedIds: id })
  await emitCommentUpsert(comment.id, "deleted")
  await notifySuperAdminsOfCommentAction("restore", ctx.actorId, mapCommentForNotification(comment))

  logActionFlow("comments", "restore", "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", "restore", id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export const bulkRestoreComments = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  ensurePermission(ctx, PERMISSIONS.COMMENTS_MANAGE)
  validateBulkIds(ids, "bình luận")

  const allRequestedComments = await prisma.comment.findMany({
    where: { id: { in: ids } },
    select: { id: true, deletedAt: true },
  })

  const softDeletedComments = allRequestedComments.filter((c) => c.deletedAt !== null && c.deletedAt !== undefined)
  const activeComments = allRequestedComments.filter((c) => c.deletedAt === null || c.deletedAt === undefined)
  const notFoundCount = ids.length - allRequestedComments.length
  const softDeletedIds = softDeletedComments.map((c) => c.id)

  logActionFlow("comments", "bulk-restore", "start", {
    requestedCount: ids.length,
    foundCount: allRequestedComments.length,
    softDeletedCount: softDeletedComments.length,
    activeCount: activeComments.length,
    notFoundCount,
    actorId: ctx.actorId,
  })

  if (softDeletedComments.length === 0) {
    const parts: string[] = []
    if (activeComments.length > 0) parts.push(`${activeComments.length} bình luận đang hoạt động`)
    if (notFoundCount > 0) parts.push(`${notFoundCount} bình luận không tồn tại (đã bị xóa vĩnh viễn)`)

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

  const comments = await prisma.comment.findMany({
    where: { id: { in: softDeletedIds }, deletedAt: { not: null } },
    include: COMMENT_INCLUDE,
  })

  const result = await prisma.comment.updateMany({
    where: { id: { in: comments.map((c) => c.id) }, deletedAt: { not: null } },
    data: { deletedAt: null },
  })

  const commentIds = comments.map((c) => c.id)
  const message = await handleBulkOperationAfterUpdate("bulk-restore", commentIds, comments, result.count, "deleted", ctx)

  logActionFlow("comments", "bulk-restore", "success", { count: result.count, commentIds }, startTime)
  return { success: true, message, affected: result.count }
}

export const hardDeleteComment = async (ctx: AuthContext, id: string): Promise<void> => {
  const startTime = Date.now()
  logActionFlow("comments", "hard-delete", "init", { commentId: id, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.COMMENTS_MANAGE])) {
    logActionFlow("comments", "hard-delete", "error", { commentId: id, error: "Không có quyền" }, startTime)
    throw new ForbiddenError()
  }

  const comment = await getCommentWithRelations(id)
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
  await notifySuperAdminsOfCommentAction("hard-delete", ctx.actorId, mapCommentForNotification(comment))

  logActionFlow("comments", "hard-delete", "success", { commentId: id, authorName: comment.author.name }, startTime)
  logDetailAction("comments", "hard-delete", id, {
    id: comment.id,
    content: comment.content,
    authorName: comment.author.name,
    postTitle: comment.post.title,
  } as unknown as Record<string, unknown>)
}

export const bulkHardDeleteComments = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> => {
  const startTime = Date.now()
  logActionFlow("comments", "bulk-hard-delete", "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.COMMENTS_MANAGE])) {
    logActionFlow("comments", "bulk-hard-delete", "error", { error: "Không có quyền" }, startTime)
    throw new ForbiddenError()
  }

  validateBulkIds(ids, "bình luận")

  const comments = await prisma.comment.findMany({
    where: { id: { in: ids }, deletedAt: { not: null } },
    include: COMMENT_INCLUDE,
  })

  if (comments.length === 0) {
    logActionFlow("comments", "bulk-hard-delete", "error", { error: "Không tìm thấy bình luận nào để xóa vĩnh viễn" }, startTime)
    throw new ApplicationError("Không tìm thấy bình luận nào để xóa vĩnh viễn", 400)
  }

  const result = await prisma.comment.deleteMany({
    where: { id: { in: comments.map((c) => c.id) }, deletedAt: { not: null } },
  })

  const commentIds = comments.map((c) => c.id)

  if (result.count > 0) {
    comments.forEach((comment) => emitCommentRemove(comment.id, "deleted"))

    try {
      await notifySuperAdminsOfBulkCommentAction("hard-delete", ctx.actorId, comments.map(mapCommentForNotification))
    } catch (error) {
      logActionFlow("comments", "bulk-hard-delete", "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

  const namesText = comments.length > 0
    ? formatCommentNames(comments.map((c) => ({ authorName: c.author.name, authorEmail: c.author.email, content: c.content })), 3)
    : ""
  const message = namesText ? `Đã xóa vĩnh viễn ${result.count} bình luận: ${namesText}` : `Đã xóa vĩnh viễn ${result.count} bình luận`

  logActionFlow("comments", "bulk-hard-delete", "success", { count: result.count, commentIds }, startTime)
  return { success: true, message, affected: result.count }
}

const handleBulkApproval = async (
  ctx: AuthContext,
  ids: string[],
  action: "approve" | "unapprove",
  startTime: number
): Promise<BulkActionResult> => {
  logActionFlow("comments", `bulk-${action}`, "start", { count: ids.length, commentIds: ids, actorId: ctx.actorId })

  ensurePermission(ctx, PERMISSIONS.COMMENTS_APPROVE, PERMISSIONS.COMMENTS_MANAGE)
  validateBulkIds(ids, "bình luận")

  const comments = await prisma.comment.findMany({
    where: { id: { in: ids }, deletedAt: null, approved: action === "approve" ? false : true },
    include: COMMENT_INCLUDE,
  })

  if (comments.length === 0) {
    const errorMsg = action === "approve" ? "Không tìm thấy bình luận nào để duyệt" : "Không tìm thấy bình luận nào để hủy duyệt"
    logActionFlow("comments", `bulk-${action}`, "error", { error: errorMsg }, startTime)
    throw new ApplicationError(errorMsg, 400)
  }

  const result = await prisma.comment.updateMany({
    where: { id: { in: comments.map((c) => c.id) }, deletedAt: null, approved: action === "approve" ? false : true },
    data: { approved: action === "approve" },
  })

  const commentIds = comments.map((c) => c.id)

  if (result.count > 0) {
    try {
      await emitCommentBatchUpsert(commentIds, "active")
    } catch (error) {
      logActionFlow("comments", `bulk-${action}`, "error", {
        error: error instanceof Error ? error.message : String(error),
        count: result.count,
      })
    }

    try {
      await notifySuperAdminsOfBulkCommentAction(action, ctx.actorId, comments.map(mapCommentForNotification))
    } catch (error) {
      logActionFlow("comments", `bulk-${action}`, "error", {
        error: error instanceof Error ? error.message : String(error),
        notificationError: true,
      })
    }
  }

  const namesText = comments.length > 0
    ? formatCommentNames(comments.map((c) => ({ authorName: c.author.name, authorEmail: c.author.email, content: c.content })), 3)
    : ""
  const actionText = action === "approve" ? "duyệt" : "hủy duyệt"
  const message = namesText ? `Đã ${actionText} ${result.count} bình luận: ${namesText}` : `Đã ${actionText} ${result.count} bình luận`

  logActionFlow("comments", `bulk-${action}`, "success", { count: result.count, commentIds }, startTime)
  return { success: true, message, affected: result.count }
}

export const bulkApproveComments = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> =>
  handleBulkApproval(ctx, ids, "approve", Date.now())

export const bulkUnapproveComments = async (ctx: AuthContext, ids: string[]): Promise<BulkActionResult> =>
  handleBulkApproval(ctx, ids, "unapprove", Date.now())

