import { resourceLogger } from "@/utils"
import type { CommentRow } from "../types"
import {
  shouldIncludeInStatus,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<CommentRow>([
  "content",
  (row) => row.authorName ?? "",
  "authorEmail",
  "postTitle",
])

// Re-export generic helper
export { shouldIncludeInStatus }

export const matchesFilters = createMatchesFilters<CommentRow>([
  "approved",
  "content",
  { field: "authorName", getValue: (row) => row.authorName ?? "" },
  "authorEmail",
  "postTitle",
  "postId",
])

export const insertRowIntoPage = (
  rows: CommentRow[],
  row: CommentRow,
  limit: number
): CommentRow[] => {
  const existingIndex = rows.findIndex((item) => item.id === row.id)
  if (existingIndex >= 0) {
    const next = [...rows]
    next[existingIndex] = row
    resourceLogger.socket({
      resource: "comments",
      action: "socket-update",
      event: "update-row-in-page",
      payload: {
        action: "update",
        commentId: row.id,
        authorName: row.authorName,
        index: existingIndex,
      },
    })
    return next
  }
  const next = [row, ...rows]
  const result = next.length > limit ? next.slice(0, limit) : next
  resourceLogger.socket({
    resource: "comments",
    action: "socket-update",
    event: "insert-row-in-page",
    payload: {
      action: "insert",
      commentId: row.id,
      authorName: row.authorName,
      wasTruncated: next.length > limit,
    },
  })
  return result
}

export const removeRowFromPage = (
  rows: CommentRow[],
  id: string
): { rows: CommentRow[]; removed: boolean } => {
  const index = rows.findIndex((item) => item.id === id)
  if (index === -1) {
    resourceLogger.socket({
      resource: "comments",
      action: "socket-update",
      event: "row-not-found-for-removal",
      payload: {
        action: "remove",
        commentId: id,
      },
    })
    return { rows, removed: false }
  }
  const next = [...rows]
  const removedRow = next[index]
  next.splice(index, 1)
  resourceLogger.socket({
    resource: "comments",
    action: "socket-update",
    event: "remove-row-from-page",
    payload: {
      action: "remove",
      commentId: id,
      authorName: removedRow?.authorName,
      index,
    },
  })
  return { rows: next, removed: true }
}

