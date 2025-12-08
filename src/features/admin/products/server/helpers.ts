import type { Prisma } from "@prisma/client"
import { serializeDate } from "@/features/admin/resources/server"
import type { ListProductsInput, ListedProduct, ProductDetail } from "./queries"
import type { ProductRow } from "../types"

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    categories: {
      include: {
        category: {
          select: {
            id: true
            name: true
          }
        }
      }
    }
    images: true
  }
}>

export function mapProductRecord(product: ProductWithRelations): ListedProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() || null,
    stock: product.stock,
    status: product.status,
    featured: product.featured,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
    categories: product.categories?.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
    })) || [],
  }
}

export function buildWhereClause(params: ListProductsInput): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {}

  // Status filter
  if (params.status) {
    if (params.status === "deleted") {
      where.deletedAt = { not: null }
    } else if (params.status === "active") {
      where.deletedAt = null
    }
  }

  // Search filter
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
      { slug: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ]
  }

  // Additional filters
  if (params.filters) {
    if (params.filters.status) {
      // Validate status is a valid ProductStatus enum value
      const validStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]
      if (validStatuses.includes(params.filters.status)) {
        where.status = params.filters.status as "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED"
      }
    }
    if (params.filters.featured !== undefined) {
      where.featured = params.filters.featured === "true"
    }
    if (params.filters.createdAt) {
      const dateValue = params.filters.createdAt
      if (typeof dateValue === "string") {
        // Handle date range filter (e.g., "2024-01-01,2024-12-31")
        const [start, end] = dateValue.split(",")
        if (start && end) {
          where.createdAt = {
            gte: new Date(start),
            lte: new Date(end),
          }
        } else if (start) {
          where.createdAt = {
            gte: new Date(start),
          }
        }
      }
    }
  }

  return where
}

export function serializeProductsList(result: { data: ListedProduct[]; pagination: { total: number; page: number; limit: number; totalPages: number } }): {
  rows: ProductRow[]
  total: number
  totalPages: number
  limit: number
} {
  return {
    rows: result.data.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      status: product.status,
      featured: product.featured,
      createdAt: serializeDate(product.createdAt) || "",
      updatedAt: serializeDate(product.updatedAt) || undefined,
      deletedAt: product.deletedAt ? serializeDate(product.deletedAt) : null,
      categories: product.categories,
    })),
    total: result.pagination.total,
    totalPages: result.pagination.totalPages,
    limit: result.pagination.limit,
  }
}

export function serializeProductForTable(product: ListedProduct): ProductRow {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    status: product.status,
    featured: product.featured,
    createdAt: serializeDate(product.createdAt) || "",
    updatedAt: serializeDate(product.updatedAt) || undefined,
    deletedAt: product.deletedAt ? serializeDate(product.deletedAt) : null,
    categories: product.categories,
  }
}

export function serializeProductDetail(product: ProductDetail) {
  // Deserialize description if it's a JSON string (SerializedEditorState)
  let description: unknown = product.description
  if (typeof product.description === "string" && product.description.trim().startsWith("{")) {
    try {
      description = JSON.parse(product.description)
    } catch {
      // If parsing fails, keep as string
      description = product.description
    }
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    status: product.status,
    featured: product.featured,
    description,
    shortDescription: product.shortDescription,
    createdAt: serializeDate(product.createdAt)!,
    updatedAt: serializeDate(product.updatedAt)!,
    deletedAt: serializeDate(product.deletedAt),
    categories: product.categories,
    images: product.images || [],
  }
}


