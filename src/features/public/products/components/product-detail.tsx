/**
 * Server Component: Product Detail
 * 
 * Fetches product data và pass xuống client component
 */

import { getProductBySlug, getRelatedProducts } from "../server/queries"
import { ProductDetailClient } from "./product-detail.client"
import { notFound } from "next/navigation"

export interface ProductDetailProps {
  slug: string
}

export async function ProductDetail({ slug }: ProductDetailProps) {
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  // Fetch related products
  const categoryIds = product.categories.map((c) => c.id)
  const relatedProducts = await getRelatedProducts(
    product.id,
    product.relatedProductIds || [],
    categoryIds,
    8
  )

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />
}

