"use client"

import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceNavigation, useResourceDetailData } from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { apiRoutes } from "@/constants"
import { queryKeys } from "@/constants"
import { getBaseCategoryFields, getCategoryFormSections, type CategoryFormData } from "../form-fields"
import type { CategoryRow } from "../types"
import { useQuery } from "@tanstack/react-query"
import { listCategories } from "../server/queries"

interface CategoryEditData extends CategoryRow {
  slug: string
  description: string | null
  updatedAt: string
  [key: string]: unknown
}

export interface CategoryEditClientProps {
  category: CategoryEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  categoryId?: string
}

export const CategoryEditClient = ({
  category: initialCategory,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  categoryId,
}: CategoryEditClientProps) => {
  const queryClient = useQueryClient()
  const { navigateBack } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminCategories.all(),
  })

  const resourceId = categoryId || initialCategory?.id
  const { data: categoryData } = useResourceDetailData({
    initialData: initialCategory || ({} as CategoryEditData),
    resourceId: resourceId || "",
    detailQueryKey: queryKeys.adminCategories.detail,
    resourceName: "categories",
    fetchOnMount: !!resourceId,
  })
  const category = (categoryData || initialCategory) as CategoryEditData | null

  // Lấy danh sách danh mục để chọn danh mục cha
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.adminCategories.list({ page: 1, limit: 1000, status: "active" }),
    queryFn: () => listCategories({ page: 1, limit: 1000, status: "active" }),
  })

  const categories = categoriesData?.data || []

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.categories.update(id),
    method: "PUT",
    resourceId: category?.id,
    messages: {
      successTitle: "Cập nhật danh mục thành công",
      successDescription: "Danh mục đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật danh mục",
    },
    navigation: {
      toDetail: variant === "page" 
        ? (backUrl || (category?.id ? `/admin/categories/${category.id}` : undefined))
          : undefined,
      fallback: backUrl,
    },
    onSuccess: createResourceEditOnSuccess({
      queryClient,
      resourceId: category?.id,
      allQueryKey: queryKeys.adminCategories.all(),
      detailQueryKey: queryKeys.adminCategories.detail,
      resourceName: "categories",
      getRecordName: (data) => data.name as string | undefined,
      onSuccess,
    }),
  })

  if (!category?.id) return null

  const isDeleted = !!category.deletedAt
  const formDisabled = isDeleted && variant !== "page"
  const editUrl = `/admin/categories/${category.id}/edit`
  
  const handleSubmitWrapper = async (data: Partial<CategoryFormData>) => {
    if (isDeleted) return { success: false, error: "Bản ghi đã bị xóa, không thể chỉnh sửa" }
    return handleSubmit(data)
  }

  const editFields: ResourceFormField<CategoryFormData>[] = getBaseCategoryFields(categories, category?.id)
  const formSections = getCategoryFormSections()

  return (
    <ResourceForm<CategoryFormData>
      data={category}
      fields={editFields.map(field => ({ ...field, disabled: formDisabled || field.disabled }))}
      sections={formSections}
      onSubmit={handleSubmitWrapper}
      title="Chỉnh sửa danh mục"
      description={isDeleted ? "Bản ghi đã bị xóa, không thể chỉnh sửa" : "Cập nhật thông tin danh mục"}
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      onBack={() => navigateBack(backUrl || editUrl)}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      showCard={variant !== "page"}
      className={variant === "page" ? "max-w-[100%]" : undefined}
      resourceName="categories"
      resourceId={category.id}
      action="update"
    />
  )
}

