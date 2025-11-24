/**
 * Helper functions cho socket bridge
 * Tách ra để dễ test và tái sử dụng
 */

import { resourceLogger } from "@/lib/config/resource-logger"
import type { CommentRow } from "../types"
import type { AdminCommentsListParams } from "@/lib/query-keys"

/**
 * Kiểm tra xem comment có match với search term không
 */
export function matchesSearch(search: string | undefined, row: CommentRow): boolean {
  if (!search || typeof search !== "string") return true
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [row.content, row.authorName ?? "", row.authorEmail, row.postTitle]
    .some((value) => value.toLowerCase().includes(term))
}

/**
 * Kiểm tra xem comment có match với filters không
 */
export function matchesFilters(
  filters: AdminCommentsListParams["filters"],
  row: CommentRow
): boolean {
  if (!filters) return true
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    switch (key) {
      case "approved": {
        const expected = value === "true"
        if (row.approved !== expected) return false
        break
      }
      case "content":
        if (row.content !== value) return false
        break
      case "authorName":
        if ((row.authorName ?? "") !== value) return false
        break
      case "authorEmail":
        if (row.authorEmail !== value) return false
        break
      case "postTitle":
        if (row.postTitle !== value) return false
        break
      case "postId":
        if (row.postId !== value) return false
        break
      default:
        break
    }
  }
  return true
}

/**
 * Kiểm tra xem comment có nên được include trong status view không
 */
export function shouldIncludeInStatus(
  paramsStatus: AdminCommentsListParams["status"],
  rowStatus: "active" | "deleted"
): boolean {
  if (paramsStatus === "all") return true
  if (!paramsStatus) return rowStatus === "active"
  return paramsStatus === rowStatus
}

/**
 * Insert hoặc update row vào page
 */
export function insertRowIntoPage(
  rows: CommentRow[],
  row: CommentRow,
  limit: number
): CommentRow[] {
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

/**
 * Remove row khỏi page
 */
export function removeRowFromPage(
  rows: CommentRow[],
  id: string
): { rows: CommentRow[]; removed: boolean } {
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

