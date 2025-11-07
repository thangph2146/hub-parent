/**
 * Client Component: Tag Create Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getBaseTagFields, type TagFormData } from "../form-fields"
import { generateSlug } from "../utils"

export interface TagCreateClientProps {
  backUrl?: string
}

export function TagCreateClient({ backUrl = "/admin/tags" }: TagCreateClientProps) {
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.tags.create,
    method: "POST",
    messages: {
      successTitle: "Tạo thẻ tag thành công",
      successDescription: "Thẻ tag mới đã được tạo thành công.",
      errorTitle: "Lỗi tạo thẻ tag",
    },
    navigation: {
      toDetail: (response) =>
        response.data?.data?.id ? `/admin/tags/${response.data.data.id}` : backUrl,
      fallback: backUrl,
    },
    transformData: (data) => ({
      ...data,
      // Auto-generate slug if not provided
      slug: (typeof data.slug === "string" ? data.slug.trim() : "") || (data.name ? generateSlug(String(data.name)) : ""),
    }),
  })

  const createFields = getBaseTagFields()

  return (
    <ResourceForm<TagFormData>
      data={null}
      fields={createFields}
      onSubmit={handleSubmit}
      title="Tạo thẻ tag mới"
      description="Nhập thông tin để tạo thẻ tag mới"
      submitLabel="Tạo thẻ tag"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
    />
  )
}

