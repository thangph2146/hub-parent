import { getProductById } from "../server/queries"
import { serializeProductDetail } from "../server/helpers"
import { ProductDetailClient } from "./product-detail.client"
import type { ProductDetailData } from "./product-detail.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface ProductDetailProps {
  productId: string
  backUrl?: string
}

export async function ProductDetail({ productId, backUrl = "/admin/products" }: ProductDetailProps) {
  const product = await getProductById(productId)

  if (!product) {
    return <NotFoundMessage resourceName="sản phẩm" />
  }

  return (
    <ProductDetailClient
      productId={productId}
      product={serializeProductDetail(product) as ProductDetailData}
      backUrl={backUrl}
    />
  )
}

