import type { CategoryRow } from "../types"
import type { AdminCategoriesListParams } from "@/lib/query-keys"

export function matchesSearch(search: string | undefined, row: CategoryRow): boolean {
  if (!search || typeof search !== "string") return true
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [row.name, row.slug, row.description].some((value) => 
    value?.toLowerCase().includes(term) ?? false
  )
}

export function matchesFilters(
  filters: AdminCategoriesListParams["filters"],
  row: CategoryRow
): boolean {
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

export function shouldIncludeInStatus(
  paramsStatus: AdminCategoriesListParams["status"],
  rowStatus: "active" | "deleted"
): boolean {
  if (paramsStatus === "all") return true
  if (!paramsStatus) return rowStatus === "active"
  return paramsStatus === rowStatus
}

export function insertRowIntoPage(
  rows: CategoryRow[],
  row: CategoryRow,
  limit: number
): CategoryRow[] {
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

export function removeRowFromPage(
  rows: CategoryRow[],
  id: string
): { rows: CategoryRow[]; removed: boolean } {
  const index = rows.findIndex((item) => item.id === id)
  if (index === -1) return { rows, removed: false }
  const next = [...rows]
  next.splice(index, 1)
  return { rows: next, removed: true }
}

