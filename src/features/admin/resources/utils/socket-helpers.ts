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
  config: Array<
    | keyof TRow
    | { field: string; getValue: (row: TRow) => unknown }
    | ((row: TRow, filterValue: string) => boolean)
  >
) => {
  return (filters: Record<string, string> | undefined, row: TRow): boolean => {
    if (!filters) return true

    return config.every((item) => {
      if (typeof item === "function") {
        // Custom matcher function: (row, filterValue) => boolean
        // Note: This requires the filter key to match the function name or be passed differently
        // For now, we'll skip this pattern and use object config instead
        return true
      } else if (typeof item === "object" && "field" in item && "getValue" in item) {
        // Object config with custom getValue
        const filterValue = filters[item.field]
        if (filterValue === undefined || filterValue === "") return true
        const rowValue = item.getValue(row)
        if (typeof rowValue === "boolean") {
          return rowValue === (filterValue === "true")
        }
        if (rowValue === null || rowValue === undefined) {
          return String(rowValue ?? "") === filterValue
        }
        return String(rowValue) === filterValue
      } else {
        // Simple field key
        const filterValue = filters[String(item)]
        if (filterValue === undefined || filterValue === "") return true
        const rowValue = row[item]
        if (typeof rowValue === "boolean") {
          return rowValue === (filterValue === "true")
        }
        if (rowValue === null || rowValue === undefined) {
          return String(rowValue ?? "") === filterValue
        }
        return String(rowValue) === filterValue
      }
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
  const existingIndex = rows.findIndex((item) => item.id === newRow.id)
  if (existingIndex >= 0) {
    const next = [...rows]
    next[existingIndex] = newRow
    return next
  }
  const next = [newRow, ...rows]
  if (next.length > limit) {
    next.pop()
  }
  return next
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