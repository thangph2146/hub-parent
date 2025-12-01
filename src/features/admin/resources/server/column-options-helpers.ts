export interface ColumnOptionsQueryOptions {
  status?: "active" | "deleted" | "all"
  search?: string
  limit?: number
}

export function applyColumnOptionsStatusFilter<T extends Record<string, unknown>>(
  where: T,
  status: "active" | "deleted" | "all" = "active"
): void {
  if (status === "active") {
    ;(where as Record<string, unknown>).deletedAt = null
  } else if (status === "deleted") {
    ;(where as Record<string, unknown>).deletedAt = { not: null }
  }
}

export function applyColumnOptionsSearchFilter<T extends Record<string, unknown>>(
  where: T,
  search: string | undefined,
  field: keyof T
): void {
  if (!search?.trim()) return
  ;(where as Record<string, unknown>)[field as string] = { contains: search.trim(), mode: "insensitive" }
}

export function buildColumnOptionsWhereClause<T extends Record<string, unknown>>(
  options: ColumnOptionsQueryOptions,
  defaultField: keyof T,
  customFields?: Record<string, keyof T>
): T {
  const where = {} as T
  applyColumnOptionsStatusFilter(where, options.status)
  if (options.search?.trim()) {
    const field = customFields?.[options.search.trim()] || defaultField
    applyColumnOptionsSearchFilter(where, options.search, field)
  }
  return where
}

export function mapToColumnOptions<T extends Record<string, unknown>>(
  results: T[],
  column: string
): Array<{ label: string; value: string }> {
  const options: Array<{ label: string; value: string }> = []
  for (const item of results) {
    const value = item[column as keyof T]
    if (typeof value === "string" && value.trim()) {
      options.push({ label: value, value })
    }
  }
  return options
}

