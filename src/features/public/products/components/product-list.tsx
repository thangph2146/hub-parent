/**
 * Server Component: Product List
 * 
 * Fetches products data và pass xuống client component
 */

import { getProducts } from "../server/queries"
import { ProductListClient } from "./product-list.client"
import { ProductListFilters } from "./product-list-filters"
import { prisma } from "@/lib/database"

export interface ProductListProps {
  category?: string
  search?: string
  featured?: boolean
  page?: number
  limit?: number
  sortBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "created_desc"
}

export async function ProductList({
  category,
  search,
  featured,
  page = 1,
  limit = 12,
  sortBy = "created_desc",
}: ProductListProps) {
  const [productsData, categories] = await Promise.all([
    getProducts({
      category,
      search,
      featured,
      page,
      limit,
      sortBy,
    }),
    prisma.category.findMany({
      where: {
        deletedAt: null,
        products: {
          some: {
            product: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  return (
    <>
      <ProductListFilters
        categories={categories}
        currentCategory={category}
        currentSearch={search}
        currentSort={sortBy}
      />
      <ProductListClient initialData={productsData} />
    </>
  )
}

