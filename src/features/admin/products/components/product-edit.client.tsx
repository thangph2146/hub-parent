"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePageLoadLogger } from "@/hooks/use-page-load-logger"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceDetailData } from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { getBaseProductFields, getProductFormSections, type ProductFormData } from "../form-fields"

interface ProductEditData extends ProductFormData {
  id: string
  categoryIds?: string[] | string
  deletedAt?: string | null
  [key: string]: unknown
}

export interface ProductEditClientProps {
  product: ProductEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  productId?: string
  categories?: Array<{ label: string; value: string }>
}

export function ProductEditClient({
  product: initialProduct,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  productId,
  categories: categoriesFromServer = [],
}: ProductEditClientProps) {
  // Log page load (chỉ khi variant là "page")
  usePageLoadLogger(variant === "page" ? "edit" : undefined)
  const queryClient = useQueryClient()

  const resourceId = productId || initialProduct?.id
  const { data: productData } = useResourceDetailData({
    initialData: initialProduct || ({} as ProductEditData),
    resourceId: resourceId || "",
    detailQueryKey: queryKeys.adminProducts.detail,
    resourceName: "products",
    fetchOnMount: !!resourceId,
  })
  const product = useMemo(() => {
    if (productData) {
      const productDataTyped = productData as ProductEditData
      return {
        ...productDataTyped,
        categoryIds:
          productDataTyped.categoryIds ||
          (Array.isArray(productDataTyped.categories)
            ? productDataTyped.categories.map((c: { id: string }) => c.id)
            : []),
      }
    }
    return initialProduct || null
  }, [productData, initialProduct])

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.products.update(id),
    method: "PUT",
    resourceId: product?.id,
    messages: {
      successTitle: "Cập nhật thành công",
      successDescription: "Thông tin sản phẩm đã được cập nhật.",
      errorTitle: "Lỗi cập nhật",
    },
    navigation: {
      toDetail: variant === "page" && productId ? `/admin/products/${productId}` : undefined,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData: Record<string, unknown> = {
        ...data,
        price: typeof data.price === "string" ? parseFloat(data.price) : data.price,
        compareAtPrice:
          data.compareAtPrice && typeof data.compareAtPrice === "string"
            ? parseFloat(data.compareAtPrice)
            : data.compareAtPrice,
        cost: data.cost && typeof data.cost === "string" ? parseFloat(data.cost) : data.cost,
        stock: typeof data.stock === "string" ? parseInt(data.stock, 10) : data.stock,
        weight: data.weight && typeof data.weight === "string" ? parseFloat(data.weight) : data.weight,
        categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds : data.categoryIds ? [data.categoryIds] : [],
      }
      return submitData
    },
    onSuccess: createResourceEditOnSuccess({
      queryClient,
      resourceId: productId || product?.id,
      allQueryKey: queryKeys.adminProducts.all(),
      detailQueryKey: queryKeys.adminProducts.detail,
      resourceName: "products",
      getRecordName: (responseData) => (responseData?.name as string | undefined) || "Sản phẩm",
      onSuccess,
    }),
  })

  if (!product?.id) {
    return null
  }

  const isDeleted = product.deletedAt !== null && product.deletedAt !== undefined
  const formDisabled = isDeleted && variant !== "page"

  const handleSubmitWrapper = async (data: Partial<ProductEditData>) => {
    if (isDeleted) {
      return { success: false, error: "Bản ghi đã bị xóa, không thể chỉnh sửa" }
    }
    return handleSubmit(data)
  }

  const baseFields = getBaseProductFields(categoriesFromServer) as unknown as ResourceFormField<ProductEditData>[]
  const editFields = baseFields.map((field) => {
    if (formDisabled) {
      return { ...field, disabled: true }
    }
    return field
  })

  return (
    <ResourceForm<ProductEditData>
      data={product}
      fields={editFields}
      sections={getProductFormSections()}
      onSubmit={handleSubmitWrapper}
      open={open}
      onOpenChange={onOpenChange}
      variant={variant}
      title="Chỉnh sửa sản phẩm"
      description={isDeleted ? "Bản ghi đã bị xóa, không thể chỉnh sửa" : "Cập nhật thông tin sản phẩm"}
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      onSuccess={onSuccess}
      showCard={false}
      className="max-w-[100%]"
      resourceName="products"
      resourceId={product?.id}
      action="update"
    />
  )
}

