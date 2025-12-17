/**
 * Generic socket helpers cho resource tables
 * Giảm code duplication trong socket-helpers files
 */

export const createMatchesSearch = <TRow extends { id: string }>(
  searchFields: Array<keyof TRow | ((row: TRow) => string | undefined)>
) => {
  return (search: string | undefined, row: TRow): boolean => {
    if (!search) return true
    const lowerSearch = search.toLowerCase()

    return searchFields.some((field) => {
      if (typeof field === "function") {
        const value = field(row)
        return value?.toLowerCase().includes(lowerSearch) ?? false
      }
      const value = row[field]
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerSearch)
      }
      if (Array.isArray(value)) {
        return value.some((item) => {
          if (typeof item === "object" && item !== null && "name" in item) {
            return String(item.name).toLowerCase().includes(lowerSearch)
          }
          return String(item).toLowerCase().includes(lowerSearch)
        })
      }
      return false
    })
  }
}

export const createMatchesFilters = <TRow extends { id: string }>(
  filterFields: Array<keyof TRow>
) => {
  return (filters: Record<string, string> | undefined, row: TRow): boolean => {
    if (!filters) return true

    return filterFields.every((field) => {
      const filterValue = filters[String(field)]
      if (filterValue === undefined) return true

      const rowValue = row[field]
      if (typeof rowValue === "boolean") {
        return rowValue === (filterValue === "true")
      }
      return String(rowValue) === filterValue
    })
  }
}

export const shouldIncludeInStatus = (
  status: "active" | "deleted" | "all" | undefined,
  rowStatus: "active" | "deleted"
): boolean => {
  if (!status || status === "all") return true
  return status === rowStatus
}

export const insertRowIntoPage = <TRow extends { id: string }>(
  rows: TRow[],
  newRow: TRow,
  limit: number
): TRow[] => {
  if (rows.length >= limit) {
    return rows
  }
  return [newRow, ...rows]
}

export const removeRowFromPage = <TRow extends { id: string }>(
  rows: TRow[],
  id: string
): {
  rows: TRow[]
  removed: boolean
} => {
  const index = rows.findIndex((r) => r.id === id)
  if (index === -1) {
    return { rows, removed: false }
  }
  return {
    rows: [...rows.slice(0, index), ...rows.slice(index + 1)],
    removed: true,
  }
}

