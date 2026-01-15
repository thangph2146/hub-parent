"use server"

import type { Prisma } from "@prisma/client/index"
import { prisma } from "@/services/prisma"
import { validatePagination, buildPagination, applyColumnOptionsStatusFilter, applyColumnOptionsSearchFilter, mapToColumnOptions } from "@/features/admin/resources/server"
import { mapCategoryRecord, buildWhereClause } from "./helpers"
import type { ListCategoriesInput, CategoryDetailInfo, ListCategoriesResult } from "../types"

export const listCategories = async (params: ListCategoriesInput = {}): Promise<ListCategoriesResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  try {
    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              children: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count({ where }),
    ])

    return {
      data: data.map(mapCategoryRecord),
      pagination: buildPagination(page, limit, total),
    }
  } catch (error) {
    console.error("[listCategories] Error:", error)
    return {
      data: [],
      pagination: buildPagination(page, limit, 0),
    }
  }
}

export const getCategoryColumnOptions = async (
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> => {
  const where: Prisma.CategoryWhereInput = {}

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
        // For other columns, search in name as fallback
        applyColumnOptionsSearchFilter(where, search, "name")
    }
  }

  // Build select based on column
  let selectField: Prisma.CategorySelect
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
    const results = await prisma.category.findMany({
      where,
      select: selectField,
      orderBy: { [column]: "asc" },
      take: limit,
    })

    // Map results to options format
    return mapToColumnOptions(results, column)
  } catch (error) {
    console.error("[getCategoryColumnOptions] Error:", error)
    return []
  }
}

export const getCategoryById = async (id: string): Promise<CategoryDetailInfo | null> => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    })

    if (!category) {
      return null
    }

    // mapCategoryRecord đã include updatedAt
    return mapCategoryRecord(category)
  } catch (error) {
    console.error("[getCategoryById] Error:", error)
    return null
  }
}

export const getActiveCategoriesForSelect = async (limit: number = 100): Promise<Array<{ label: string; value: string; parentId: string | null }>> => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
    })

    return categories.map((category) => ({
      label: category.name,
      value: category.id,
      parentId: category.parentId,
    }))
  } catch (error) {
    console.error("[getActiveCategoriesForSelect] Error:", error)
    return []
  }
}

