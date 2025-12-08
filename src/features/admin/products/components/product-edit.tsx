import { getActiveCategoriesForSelect } from "@/features/admin/categories/server/queries"
import { getProductById } from "../server/queries"
import { serializeProductDetail } from "../server/helpers"
import { ProductEditClient } from "./product-edit.client"
import type { ProductEditClientProps } from "./product-edit.client"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface ProductEditProps {
  productId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export async function ProductEdit({
  productId,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: ProductEditProps) {
  const [product, categories] = await Promise.all([
    getProductById(productId),
    getActiveCategoriesForSelect(),
  ])

  if (!product) {
    return <NotFoundMessage resourceName="sản phẩm" />
  }

  const productForEdit: ProductEditClientProps["product"] = {
    ...serializeProductDetail(product),
    categoryIds: product.categories?.map((c) => c.id) || [],
    status: product.status as "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED",
    description: (product.description as string | null | undefined) ?? null,
  }

  return (
    <ProductEditClient
      product={productForEdit}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      variant={variant}
      backUrl={backUrl}
      backLabel={backLabel}
      productId={productId}
      categories={categories}
    />
  )
}

