import type { ProductRow } from "../types"

export function matchesSearch(search: string | undefined, row: ProductRow): boolean {
  if (!search) return true
  const lowerSearch = search.toLowerCase()
  return (
    row.name.toLowerCase().includes(lowerSearch) ||
    row.sku.toLowerCase().includes(lowerSearch) ||
    row.slug.toLowerCase().includes(lowerSearch) ||
    (row.categories?.some((cat: { name: string }) => cat.name.toLowerCase().includes(lowerSearch)) ?? false)
  )
}

export function matchesFilters(filters: Record<string, string> | undefined, row: ProductRow): boolean {
  if (!filters) return true

  if (filters.status && row.status !== filters.status) {
    return false
  }

  if (filters.featured !== undefined) {
    const isFeatured = filters.featured === "true"
    if (row.featured !== isFeatured) {
      return false
    }
  }

  return true
}

export function shouldIncludeInStatus(
  status: "active" | "deleted" | "all" | undefined,
  rowStatus: "active" | "deleted"
): boolean {
  if (!status || status === "all") return true
  return status === rowStatus
}

export function insertRowIntoPage(
  rows: ProductRow[],
  newRow: ProductRow,
  limit: number
): ProductRow[] {
  if (rows.length >= limit) {
    return rows
  }
  return [newRow, ...rows]
}

export function removeRowFromPage(rows: ProductRow[], id: string): {
  rows: ProductRow[]
  removed: boolean
} {
  const index = rows.findIndex((r) => r.id === id)
  if (index === -1) {
    return { rows, removed: false }
  }
  return {
    rows: [...rows.slice(0, index), ...rows.slice(index + 1)],
    removed: true,
  }
}

