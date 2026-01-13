import type { DataTableResult } from "@/components/tables"
import { logger } from "@/utils"
import type { ResourcePagination, ResourceResponse } from "../types"
import { validateCUID } from "@/utils"

export const serializeDate = (date: Date | string | null | undefined): string | null => {
  if (!date) return null
  
  try {
    // Convert to Date object if it's a string
    let dateObj: Date
    if (typeof date === "string") {
      dateObj = new Date(date)
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      // Try to convert unknown type to Date
      dateObj = new Date(date as unknown as string | number)
    }

    if (isNaN(dateObj.getTime())) {
      logger.warn("Invalid date encountered in serializeDate", { date, type: typeof date })
      return null
    }
    return dateObj.toISOString()
  } catch (error) {
    logger.error("Error serializing date", { date, error: error as Error })
    return null
  }
}

export const serializeDates = <T extends Record<string, unknown>>(
  data: T,
  dateFields: (keyof T)[]
): Record<string, unknown> => {
  const serialized: Record<string, unknown> = { ...data }
  for (const field of dateFields) {
    if (field in data && data[field] instanceof Date) {
      serialized[String(field)] = serializeDate(data[field] as Date)
    }
  }
  return serialized
}

export const buildPagination = (
  page: number,
  limit: number,
  total: number
): ResourcePagination => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

export const validatePagination = (
  page?: number,
  limit?: number,
  maxLimit = 100
): { page: number; limit: number } => {
  return {
    page: Math.max(1, page ?? 1),
    limit: Math.max(1, Math.min(limit ?? 10, maxLimit)),
  }
}

export const serializeResourceForTable = <T extends Record<string, unknown>>(
  item: T,
  dateFields: (keyof T)[] = []
): T => {
  return serializeDates(item, dateFields) as T
}

export const serializeResourceList = <T extends Record<string, unknown>>(
  data: ResourceResponse<T>,
  dateFields: (keyof T)[] = []
): DataTableResult<T> => {
  return {
    page: data.pagination.page,
    limit: data.pagination.limit,
    total: data.pagination.total,
    totalPages: data.pagination.totalPages,
    rows: data.data.map((item) => serializeResourceForTable(item, dateFields)),
  }
}

/**
 * Generic helper để serialize list với custom serializer function
 * Giảm code duplication trong các serializeXXXList functions
 */
export const createSerializeList = <TInput, TOutput extends object>(
  serializeForTable: (item: TInput) => TOutput
) => {
  return (data: {
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    data: TInput[]
  }): DataTableResult<TOutput> => {
    return {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: data.pagination.totalPages,
      rows: data.data.map(serializeForTable),
    }
  }
}

export const applyStatusFilter = <T extends Record<string, unknown>>(
  where: T,
  status?: "active" | "deleted" | "all"
): void => {
  const filterStatus = status ?? "active"
  if (filterStatus === "active") {
    Object.assign(where, { deletedAt: null })
  } else if (filterStatus === "deleted") {
    Object.assign(where, { deletedAt: { not: null } })
  }
  // "all" means no filter applied
}

export const applySearchFilter = <T extends Record<string, unknown>>(
  where: T,
  search: string | undefined,
  fields: Array<keyof T | string>
): void => {
  if (!search) return
  
  const searchValue = search.trim()
  if (searchValue.length === 0) return

  const orConditions = fields.map((field) => ({
    [String(field)]: { contains: searchValue, mode: "insensitive" as const },
  }))

  Object.assign(where, { OR: orConditions })
}

export const applyDateFilter = <T extends Record<string, unknown>>(
  where: T,
  dateField: keyof T,
  dateValue: string | undefined
): void => {
  if (!dateValue) return

  try {
    let startOfDay: Date
    let endOfDay: Date

    // If dateValue is in format "yyyy-MM-dd", create UTC dates
    // Otherwise, parse as-is (for ISO strings)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      // Format: "2026-01-01" -> UTC dates
      startOfDay = new Date(`${dateValue}T00:00:00.000Z`)
      endOfDay = new Date(`${dateValue}T23:59:59.999Z`)
    } else {
      // ISO string or other format, parse and use local timezone
      const filterDate = new Date(dateValue)
      if (isNaN(filterDate.getTime())) return

      startOfDay = new Date(filterDate)
      startOfDay.setHours(0, 0, 0, 0)
      endOfDay = new Date(filterDate)
      endOfDay.setHours(23, 59, 59, 999)
    }

    if (isNaN(startOfDay.getTime()) || isNaN(endOfDay.getTime())) return

    Object.assign(where, {
      [dateField]: {
        gte: startOfDay,
        lte: endOfDay,
      }
    })
  } catch {
    // Invalid date format, skip filter
  }
}

export const applyDateRangeFilter = <T extends Record<string, unknown>>(
  where: T,
  dateField: keyof T,
  dateRangeValue: string | undefined
): void => {
  if (!dateRangeValue) return

  try {
    // Format: "fromDate|toDate" or "fromDate|" or "|toDate"
    const parts = dateRangeValue.split("|")
    const fromStr = parts[0]?.trim()
    const toStr = parts[1]?.trim()

    const dateRange: { gte?: Date; lte?: Date } = {}

    if (fromStr) {
      // Parse date string (yyyy-MM-dd) and create UTC date for start of day
      // Format: "2026-01-01" -> "2026-01-01T00:00:00.000Z"
      const fromDate = new Date(`${fromStr}T00:00:00.000Z`)
      if (!isNaN(fromDate.getTime())) {
        dateRange.gte = fromDate
      }
    }

    if (toStr) {
      // Parse date string (yyyy-MM-dd) and create UTC date for end of day
      // Format: "2026-01-08" -> "2026-01-08T23:59:59.999Z"
      const toDate = new Date(`${toStr}T23:59:59.999Z`)
      if (!isNaN(toDate.getTime())) {
        dateRange.lte = toDate
      }
    }

    if (dateRange.gte || dateRange.lte) {
      Object.assign(where, { [dateField]: dateRange })
    }
  } catch {
    // Invalid date format, skip filter
  }
}

export const applyBooleanFilter = <T extends Record<string, unknown>>(
  where: T,
  field: keyof T,
  value: string | undefined
): void => {
  if (!value) return

  const normalizedValue = value.trim().toLowerCase()
  if (normalizedValue === "true" || normalizedValue === "1") {
    Object.assign(where, { [field]: true })
  } else if (normalizedValue === "false" || normalizedValue === "0") {
    Object.assign(where, { [field]: false })
  }
}

export const applyStringFilter = <T extends Record<string, unknown>>(
  where: T,
  field: keyof T,
  value: string | undefined
): void => {
  if (!value) return

  const trimmedValue = value.trim()
  if (trimmedValue.length === 0) return

  Object.assign(where, { [field]: { contains: trimmedValue, mode: "insensitive" } })
}

export const applyRelationFilter = <T extends Record<string, unknown>>(
  where: T,
  relationField: string,
  idField: string,
  value: string | undefined,
  relationFilters: Record<string, "contains" | "equals"> = { name: "contains" }
): void => {
  if (!value) return

  const trimmedValue = value.trim()
  if (trimmedValue.length === 0) return
  const cuidValidation = validateCUID(trimmedValue)

  if (cuidValidation.valid) {
    Object.assign(where, { [idField]: trimmedValue })
  } else {
    const relationConditions: Record<string, unknown> = {}
    for (const [field, operator] of Object.entries(relationFilters)) {
      if (operator === "contains") {
        relationConditions[field] = { contains: trimmedValue, mode: "insensitive" as const }
      } else {
        relationConditions[field] = { equals: trimmedValue, mode: "insensitive" as const }
      }
    }
    Object.assign(where, { [relationField]: relationConditions })
  }
}

export interface RelationFilterConfig {
  idField: string
  fieldMap: Record<string, string>
  operators?: Record<string, "contains" | "equals">
}

export const applyRelationFilters = <T extends Record<string, unknown>>(
  where: T,
  filters: Record<string, string | boolean | undefined> | undefined,
  relationConfigs: Record<string, RelationFilterConfig>
): void => {
  if (!filters) return

  for (const [relationField, config] of Object.entries(relationConfigs)) {
    if (config.idField in where) continue

    const relationFilters = Object.entries(config.fieldMap)
      .map(([k, v]) => {
        const val = filters[k]
        return typeof val === "string" && val.trim() ? { field: v, value: val.trim() } : null
      })
      .filter((f): f is { field: string; value: string } => f !== null)

    if (relationFilters.length === 0) continue

    const operators = config.operators || {}
    const idFilter = relationFilters.find((f) => validateCUID(f.value).valid)

    if (idFilter) {
      Object.assign(where, { [config.idField]: idFilter.value })
    } else {
      const conditions: Record<string, unknown> = {}
      for (const { field, value } of relationFilters) {
        const op = operators[field] || "contains"
        conditions[field] = op === "contains"
          ? { contains: value, mode: "insensitive" as const }
          : { equals: value, mode: "insensitive" as const }
      }
      if (Object.keys(conditions).length > 0) {
        Object.assign(where, { [relationField]: conditions })
      }
    }
  }
}

export const applyStatusFilterFromFilters = <T extends Record<string, unknown>>(
  where: T,
  statusValue: string | undefined
): void => {
  if (!statusValue) return

  const value = statusValue.trim()
  if (value === "deleted") {
    Object.assign(where, { deletedAt: { not: null } })
  } else if (value === "active") {
    Object.assign(where, { deletedAt: null })
  }
}

