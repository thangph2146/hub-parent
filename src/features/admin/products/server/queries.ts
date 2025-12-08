import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/database"
import { validatePagination, buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import { mapProductRecord, buildWhereClause } from "./helpers"

export interface ListProductsInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface ListedProduct {
  id: string
  name: string
  slug: string
  sku: string
  price: string
  compareAtPrice: string | null
  stock: number
  status: string
  featured: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  categories?: Array<{
    id: string
    name: string
  }>
}

export interface ProductDetail extends ListedProduct {
  description: string | null
  shortDescription: string | null
  images?: Array<{
    id: string
    url: string
    alt: string | null
    order: number
    isPrimary: boolean
  }>
}

export interface ListProductsResult {
  data: ListedProduct[]
  pagination: ResourcePagination
}

const PRODUCT_INCLUDE = {
  categories: {
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  images: {
    orderBy: {
      order: "asc" as const,
    },
  },
} satisfies Prisma.ProductInclude

export async function listProducts(params: ListProductsInput = {}): Promise<ListProductsResult> {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: PRODUCT_INCLUDE,
    }),
    prisma.product.count({ where }),
  ])

  return {
    data: products.map(mapProductRecord),
    pagination: buildPagination(page, limit, total),
  }
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  })

  if (!product) {
    return null
  }

  return {
    ...mapProductRecord(product),
    description: product.description,
    shortDescription: product.shortDescription,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      order: img.order,
      isPrimary: img.isPrimary,
    })),
  }
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_INCLUDE,
  })

  if (!product) {
    return null
  }

  return {
    ...mapProductRecord(product),
    description: product.description,
    shortDescription: product.shortDescription,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      order: img.order,
      isPrimary: img.isPrimary,
    })),
  }
}

