/**
 * Client Component: Category Create Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getBaseCategoryFields, type CategoryFormData } from "../form-fields"
import { generateSlug } from "../utils"

export interface CategoryCreateClientProps {
  backUrl?: string
}

export function CategoryCreateClient({ backUrl = "/admin/categories" }: CategoryCreateClientProps) {
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.categories.create,
    method: "POST",
    messages: {
      successTitle: "Tạo danh mục thành công",
      successDescription: "Danh mục mới đã được tạo thành công.",
      errorTitle: "Lỗi tạo danh mục",
    },
    navigation: {
      toDetail: (response) =>
        response.data?.data?.id ? `/admin/categories/${response.data.data.id}` : backUrl,
      fallback: backUrl,
    },
    transformData: (data) => ({
      ...data,
      // Auto-generate slug if not provided
      slug: (typeof data.slug === "string" ? data.slug.trim() : "") || (data.name ? generateSlug(String(data.name)) : ""),
    }),
  })

  const createFields = getBaseCategoryFields()

  return (
    <ResourceForm<CategoryFormData>
      data={null}
      fields={createFields}
      onSubmit={handleSubmit}
      title="Tạo danh mục mới"
      description="Nhập thông tin để tạo danh mục mới"
      submitLabel="Tạo danh mục"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
    />
  )
}

