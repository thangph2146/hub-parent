"use client"

import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/constants"
import { queryKeys } from "@/constants"
import { resourceLogger } from "@/utils"
import { getBaseTagFields, getTagFormSections, type TagFormData } from "../form-fields"

export interface TagCreateClientProps {
  backUrl?: string
}

export const TagCreateClient = ({ backUrl = "/admin/tags" }: TagCreateClientProps) => {
  const queryClient = useQueryClient()
  
  const handleBack = async () => {
    // Chỉ invalidate queries - table sẽ tự động refresh qua query cache events
    await queryClient.invalidateQueries({ queryKey: queryKeys.adminTags.all(), refetchType: "active" })
  }
  
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
    onSuccess: async (response) => {
      resourceLogger.logFlow({
        resource: "tags",
        action: "create",
        step: "success",
        details: {
          tagId: response?.data?.data?.id,
          responseStatus: response?.status,
        },
      })
      // Không cần invalidate/refetch ở đây vì createResourceCreateOnSuccess đã xử lý
    },
  })

  const createFields: ResourceFormField<TagFormData>[] = getBaseTagFields()
  const formSections = getTagFormSections()

  return (
    <ResourceForm<TagFormData>
      data={null}
      fields={createFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Tạo thẻ tag mới"
      description="Nhập thông tin để tạo thẻ tag mới"
      submitLabel="Tạo thẻ tag"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={handleBack}
      variant="page"
      showCard={false}
      className="max-w-[100%]"
      resourceName="tags"
      action="create"
    />
  )
}


