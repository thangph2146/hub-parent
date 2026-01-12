import { prisma } from "@/services/prisma"
import { getSocketServer } from "@/services/socket/state"
import { mapCommentRecord, serializeCommentForTable } from "./helpers"
import type { CommentRow } from "../types"
import { resourceLogger } from "@/utils"

const SUPER_ADMIN_ROOM = "role:super_admin"

export type CommentStatus = "active" | "deleted"

const resolveStatusFromRow = (row: CommentRow): CommentStatus => {
  return row.deletedAt ? "deleted" : "active"
}

const fetchCommentRow = async (commentId: string): Promise<CommentRow | null> => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
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
    return null
  }

  const listed = mapCommentRecord(comment)
  return serializeCommentForTable(listed)
}

export const emitCommentUpsert = async (
  commentId: string,
  previousStatus: CommentStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  if (!io) return

  const row = await fetchCommentRow(commentId)
  if (!row) {
    if (previousStatus) {
      emitCommentRemove(commentId, previousStatus)
    }
    return
  }

  const newStatus = resolveStatusFromRow(row)

  io.to(SUPER_ADMIN_ROOM).emit("comment:upsert", {
    comment: row,
    previousStatus,
    newStatus,
  })
  
  resourceLogger.socket({
    resource: "comments",
    action: previousStatus === null ? "create" : previousStatus !== newStatus ? "update" : "update",
    event: "comment:upsert",
    resourceId: commentId,
    payload: { commentId, previousStatus, newStatus },
  })
}

export const emitCommentRemove = (commentId: string, previousStatus: CommentStatus): void => {
  const io = getSocketServer()
  if (!io) return

  io.to(SUPER_ADMIN_ROOM).emit("comment:remove", {
    id: commentId,
    previousStatus,
  })
  
  resourceLogger.socket({
    resource: "comments",
    action: "hard-delete",
    event: "comment:remove",
    resourceId: commentId,
    payload: { commentId, previousStatus },
  })
}

export const emitCommentBatchUpsert = async (
  commentIds: string[],
  previousStatus: CommentStatus | null,
): Promise<void> => {
  const io = getSocketServer()
  if (!io || commentIds.length === 0) return

  // Fetch tất cả comments trong một query
  const comments = await prisma.comment.findMany({
    where: {
      id: { in: commentIds },
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

  // Map comments to rows
  const rows: CommentRow[] = []
  for (const comment of comments) {
    const listed = mapCommentRecord(comment)
    const row = serializeCommentForTable(listed)
    rows.push(row)
  }

  // Emit batch event với tất cả rows
  io.to(SUPER_ADMIN_ROOM).emit("comment:batch-upsert", {
    comments: rows,
    previousStatus,
  })
  
  resourceLogger.logFlow({
    resource: "comments",
    action: "socket-update",
    step: "success",
    details: { count: rows.length, type: "batch" },
  })
}
