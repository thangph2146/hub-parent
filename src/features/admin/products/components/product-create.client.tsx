"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { useToast } from "@/hooks/use-toast"
import { getBaseProductFields, getProductFormSections, type ProductFormData } from "../form-fields"
import { usePageLoadLogger } from "@/hooks/use-page-load-logger"

export interface ProductCreateClientProps {
  backUrl?: string
  categories?: Array<{ label: string; value: string }>
}

export function ProductCreateClient({
  backUrl = "/admin/products",
  categories: categoriesFromServer = [],
}: ProductCreateClientProps) {
  const { toast } = useToast()

  // Log page load
  usePageLoadLogger("new")

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.products.create,
    method: "POST",
    messages: {
      successTitle: "Tạo sản phẩm thành công",
      successDescription: "Sản phẩm mới đã được tạo thành công.",
      errorTitle: "Lỗi tạo sản phẩm",
    },
    navigation: {
      toDetail: (response) =>
        response.data?.data?.id ? `/admin/products/${response.data.data.id}` : backUrl,
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
      if (!submitData.name || !submitData.sku || !submitData.price) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Tên sản phẩm, SKU và giá là bắt buộc.",
        })
        throw new Error("Tên sản phẩm, SKU và giá là bắt buộc")
      }
      return submitData
    },
  })

  const createFields = getBaseProductFields(categoriesFromServer)

  return (
    <ResourceForm<ProductFormData>
      data={null}
      fields={createFields}
      sections={getProductFormSections()}
      onSubmit={handleSubmit}
      title="Tạo sản phẩm mới"
      description="Nhập thông tin để tạo sản phẩm mới"
      submitLabel="Tạo sản phẩm"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
      resourceName="products"
      action="create"
    />
  )
}

