import type { Prisma } from "@prisma/client"
import { prisma } from "@/services/prisma"
import {
  validatePagination,
  buildPagination,
  applyColumnOptionsStatusFilter,
  applyColumnOptionsSearchFilter,
  mapToColumnOptions,
} from "@/features/admin/resources/server"
import { mapTagRecord, buildWhereClause } from "./helpers"
import type { ListTagsInput, TagDetailInfo, ListTagsResult } from "../types"

export const listTags = async (params: ListTagsInput = {}): Promise<ListTagsResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  try {
    const [data, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tag.count({ where }),
    ])

    return {
      data: data.map(mapTagRecord),
      pagination: buildPagination(page, limit, total),
    }
  } catch (error) {
    console.error("[listTags] Error:", error)
    return {
      data: [],
      pagination: buildPagination(page, limit, 0),
    }
  }
}

export const getTagColumnOptions = async (
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> => {
  const where: Prisma.TagWhereInput = {}

  // Apply status filter (default: active - column options thường chỉ cần active items)
  applyColumnOptionsStatusFilter(where, "active")

  // Apply search filter based on column
  if (search && search.trim()) {
    switch (column) {
      case "name":
        applyColumnOptionsSearchFilter(where, search, "name")
        break
      case "slug":
        applyColumnOptionsSearchFilter(where, search, "slug")
        break
      default:
        applyColumnOptionsSearchFilter(where, search, "name")
    }
  }

  // Build select based on column
  let selectField: Prisma.TagSelect
  switch (column) {
    case "name":
      selectField = { name: true }
      break
    case "slug":
      selectField = { slug: true }
      break
    default:
      selectField = { name: true }
  }

  try {
    const results = await prisma.tag.findMany({
      where,
      select: selectField,
      orderBy: { [column]: "asc" },
      take: limit,
    })

    // Map results to options format
    return mapToColumnOptions(results, column)
  } catch (error) {
    console.error("[getTagColumnOptions] Error:", error)
    return []
  }
};

export const getTagById = async (id: string): Promise<TagDetailInfo | null> => {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
    })

    if (!tag) {
      return null
    }

    // mapTagRecord đã include updatedAt
    return mapTagRecord(tag)
  } catch (error) {
    console.error("[getTagById] Error:", error)
    return null
  }
};

export const getActiveTagsForSelect = async (limit: number = 100): Promise<Array<{ label: string; value: string }>> => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    })

    return tags.map((tag) => ({
      label: tag.name,
      value: tag.id,
    }))
  } catch (error) {
    console.error("[getActiveTagsForSelect] Error:", error)
    return []
  }
};

