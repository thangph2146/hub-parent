/**
 * Helper functions cho socket bridge
 * Tách ra để dễ test và tái sử dụng
 */

import type { RoleRow } from "../types"
import type { AdminRolesListParams } from "@/lib/query-keys"

/**
 * Kiểm tra xem role có match với search term không
 */
export function matchesSearch(search: string | undefined, row: RoleRow): boolean {
  if (!search || typeof search !== "string") return true
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [row.name, row.displayName ?? "", row.description ?? ""]
    .some((value) => value.toLowerCase().includes(term))
}

/**
 * Kiểm tra xem role có match với filters không
 */
export function matchesFilters(
  filters: AdminRolesListParams["filters"],
  row: RoleRow
): boolean {
  if (!filters) return true
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    switch (key) {
      case "isActive": {
        const expected = value === "true"
        if (row.isActive !== expected) return false
        break
      }
      case "name":
        if (row.name !== value) return false
        break
      case "displayName":
        if ((row.displayName ?? "") !== value) return false
        break
      default:
        break
    }
  }
  return true
}

/**
 * Kiểm tra xem role có nên được include trong status view không
 */
export function shouldIncludeInStatus(
  paramsStatus: AdminRolesListParams["status"],
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
  rows: RoleRow[],
  row: RoleRow,
  limit: number
): RoleRow[] {
  const existingIndex = rows.findIndex((item) => item.id === row.id)
  if (existingIndex >= 0) {
    const next = [...rows]
    next[existingIndex] = row
    return next
  }
  const next = [row, ...rows]
  if (next.length > limit) {
    next.pop()
  }
  return next
}

/**
 * Remove row khỏi page
 */
export function removeRowFromPage(
  rows: RoleRow[],
  id: string
): { rows: RoleRow[]; removed: boolean } {
  const index = rows.findIndex((item) => item.id === id)
  if (index === -1) return { rows, removed: false }
  const next = [...rows]
  next.splice(index, 1)
  return { rows: next, removed: true }
}


