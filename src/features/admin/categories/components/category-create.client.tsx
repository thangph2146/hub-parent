"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/constants"
import { queryKeys } from "@/constants"
import { resourceLogger } from "@/utils"
import { getBaseCategoryFields, getCategoryFormSections, type CategoryFormData } from "../form-fields"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { listCategories } from "../server/queries"
import { useMemo } from "react"

export interface CategoryCreateClientProps {
  backUrl?: string
}

export const CategoryCreateClient = ({ backUrl = "/admin/categories" }: CategoryCreateClientProps) => {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.adminCategories.all()

  // Lấy danh sách danh mục để chọn danh mục cha
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.adminCategories.list({ page: 1, limit: 1000, status: "all" }),
    queryFn: () => listCategories({ page: 1, limit: 1000, status: "all" }),
  })

  const categories = useMemo(() => categoriesData?.data || [], [categoriesData])

  const handleBack = () => {
    // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
    queryClient.invalidateQueries({ queryKey, refetchType: "active" })
  }

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.categories.create,
    method: "POST",
    messages: {
      successTitle: "Tạo danh mục thành công",
      successDescription: "Danh mục mới đã được tạo thành công.",
      errorTitle: "Lỗi tạo danh mục",
    },
    navigation: {
      toDetail: (response) => response.data?.data?.id 
        ? `/admin/categories/${response.data.data.id}` 
        : backUrl,
      fallback: backUrl,
    },
    onSuccess: (response) => {
      resourceLogger.logFlow({
        resource: "categories",
        action: "create",
        step: "success",
        details: {
          categoryId: response?.data?.data?.id,
          responseStatus: response?.status,
        },
      })
      // Không cần invalidate ở đây vì createResourceCreateOnSuccess đã xử lý
    },
  })

  const createFields = useMemo(() => getBaseCategoryFields(categories), [categories])
  const formSections = useMemo(() => getCategoryFormSections(), [])

  return (
    <ResourceForm<CategoryFormData>
      data={null}
      fields={createFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Tạo danh mục mới"
      description="Nhập thông tin để tạo danh mục mới"
      submitLabel="Tạo danh mục"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={handleBack}
      variant="page"
      showCard={false}
      className="max-w-[100%]"
      resourceName="categories"
      action="create"
    />
  )
}


