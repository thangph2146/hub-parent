import type { OrderRow } from "../types"

export function matchesSearch(search: string | undefined, row: OrderRow): boolean {
  if (!search) return true
  const lowerSearch = search.toLowerCase()
  return (
    row.orderNumber.toLowerCase().includes(lowerSearch) ||
    row.customerName.toLowerCase().includes(lowerSearch) ||
    row.customerEmail.toLowerCase().includes(lowerSearch) ||
    (row.customerPhone?.toLowerCase().includes(lowerSearch) ?? false)
  )
}

export function matchesFilters(filters: Record<string, string> | undefined, row: OrderRow): boolean {
  if (!filters) return true

  if (filters.status && row.status !== filters.status) {
    return false
  }

  if (filters.paymentStatus && row.paymentStatus !== filters.paymentStatus) {
    return false
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
  rows: OrderRow[],
  newRow: OrderRow,
  limit: number
): OrderRow[] {
  if (rows.length >= limit) {
    return rows
  }
  return [newRow, ...rows]
}

export function removeRowFromPage(rows: OrderRow[], id: string): {
  rows: OrderRow[]
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

