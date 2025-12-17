import type { TagRow } from "../types"
import type { AdminTagsListParams } from "@/lib/query-keys"

export const matchesSearch = (search: string | undefined, row: TagRow): boolean => {
  if (!search || typeof search !== "string") return true
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [row.name, row.slug].some((value) => value.toLowerCase().includes(term))
}

export const matchesFilters = (
  filters: AdminTagsListParams["filters"],
  row: TagRow
): boolean => {
  if (!filters) return true
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    switch (key) {
      case "name":
        if (row.name !== value) return false
        break
      case "slug":
        if (row.slug !== value) return false
        break
      default:
        break
    }
  }
  return true
}

export const shouldIncludeInStatus = (
  paramsStatus: AdminTagsListParams["status"],
  rowStatus: "active" | "deleted"
): boolean => {
  if (paramsStatus === "all") return true
  if (!paramsStatus) return rowStatus === "active"
  return paramsStatus === rowStatus
}

export const insertRowIntoPage = (
  rows: TagRow[],
  row: TagRow,
  limit: number
): TagRow[] => {
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

export const removeRowFromPage = (
  rows: TagRow[],
  id: string
): { rows: TagRow[]; removed: boolean } => {
  const index = rows.findIndex((item) => item.id === id)
  if (index === -1) return { rows, removed: false }
  const next = [...rows]
  next.splice(index, 1)
  return { rows: next, removed: true }
}

