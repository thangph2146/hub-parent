"use client"

import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { resourceLogger } from "@/lib/config/resource-logger"
import { getBaseCategoryFields, getCategoryFormSections, type CategoryFormData } from "../form-fields"
import { useQueryClient } from "@tanstack/react-query"

export interface CategoryCreateClientProps {
  backUrl?: string
}

export const CategoryCreateClient = ({ backUrl = "/admin/categories" }: CategoryCreateClientProps) => {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.adminCategories.all()

  const handleBack = () => queryClient.invalidateQueries({ queryKey, refetchType: "all" })

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
      resourceLogger.actionFlow({
        resource: "categories",
        action: "create",
        step: "success",
        metadata: {
          categoryId: response?.data?.data?.id,
          responseStatus: response?.status,
        },
      })
      queryClient.invalidateQueries({ queryKey, refetchType: "all" })
    },
  })

  const createFields: ResourceFormField<CategoryFormData>[] = getBaseCategoryFields()
  const formSections = getCategoryFormSections()

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

