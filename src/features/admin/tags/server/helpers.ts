import type { Prisma } from "@prisma/client"
import {
  serializeDate,
  applyStatusFilter,
  applySearchFilter,
  applyDateFilter,
  applyStringFilter,
  applyStatusFilterFromFilters,
  createSerializeList,
} from "@/features/admin/resources/server"
import type { ListTagsInput, ListedTag, TagDetail } from "../types"
import type { TagRow } from "../types"

type TagWithRelations = Prisma.TagGetPayload<Record<string, never>>

export const mapTagRecord = (tag: TagWithRelations): ListedTag => {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    deletedAt: tag.deletedAt,
  }
}

export const buildWhereClause = (params: ListTagsInput): Prisma.TagWhereInput => {
  const where: Prisma.TagWhereInput = {}

  // Apply status filter
  applyStatusFilter(where, params.status)

  // Apply search filter
  applySearchFilter(where, params.search, ["name", "slug"])

  // Apply custom filters
  if (params.filters) {
    const activeFilters = Object.entries(params.filters).filter(([, value]) => Boolean(value))
    for (const [key, rawValue] of activeFilters) {
      const value = typeof rawValue === "string" ? rawValue.trim() : ""
      if (!value) continue

      switch (key) {
        case "name":
        case "slug":
          applyStringFilter(where, key, value)
          break
        case "status":
          applyStatusFilterFromFilters(where, value)
          break
        case "createdAt":
        case "deletedAt":
          applyDateFilter(where, key, value)
          break
      }
    }
  }

  return where
}

export const serializeTagForTable = (tag: ListedTag | { id: string; name: string; slug: string; createdAt: Date | string; updatedAt?: Date | string; deletedAt: Date | string | null }): TagRow => {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: serializeDate(tag.createdAt)!,
    updatedAt: tag.updatedAt ? (serializeDate(tag.updatedAt) ?? undefined) : undefined, // Thêm updatedAt để so sánh cache chính xác (convert null to undefined)
    deletedAt: serializeDate(tag.deletedAt),
  }
}

export const serializeTagsList = createSerializeList(serializeTagForTable)

export const serializeTagDetail = (tag: TagDetail) => {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: serializeDate(tag.createdAt)!,
    updatedAt: serializeDate(tag.updatedAt)!,
    deletedAt: serializeDate(tag.deletedAt),
  }
}

export type { TagWithRelations }

