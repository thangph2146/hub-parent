import type { ResourceResponse, BaseResourceTableClientProps } from "@/features/admin/resources/types"

export interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string
  price: string
  compareAtPrice: string | null
  stock: number
  status: string
  featured: boolean
  createdAt: string
  updatedAt?: string
  deletedAt: string | null
  categories?: Array<{
    id: string
    name: string
  }>
}

export type ProductsTableClientProps = BaseResourceTableClientProps<ProductRow>

export type ProductsResponse = ResourceResponse<ProductRow>
