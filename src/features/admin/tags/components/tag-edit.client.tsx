/**
 * Client Component: Tag Edit Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceNavigation } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import { resourceLogger } from "@/lib/config"
import { getBaseTagFields, type TagFormData } from "../form-fields"
import type { TagRow } from "../types"

interface TagEditData extends TagRow {
  slug: string
  updatedAt: string
  [key: string]: unknown
}

export interface TagEditClientProps {
  tag: TagEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  tagId?: string
}

export function TagEditClient({
  tag,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  tagId: _tagId,
}: TagEditClientProps) {
  const queryClient = useQueryClient()
  const { navigateBack } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminTags.all(),
  })
  
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.tags.update(id),
    method: "PUT",
    resourceId: tag?.id,
    messages: {
      successTitle: "Cập nhật thẻ tag thành công",
      successDescription: "Thẻ tag đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật thẻ tag",
    },
    navigation: {
      toDetail: variant === "page" && backUrl
        ? backUrl
        : variant === "page" && tag?.id
          ? `/admin/tags/${tag.id}`
          : undefined,
      fallback: backUrl,
    },
    onSuccess: async (response) => {
      const targetTagId = tag?.id
      const responseData = response?.data?.data
      
      // Cập nhật React Query cache trực tiếp với dữ liệu từ response
      // Điều này đảm bảo UI được cập nhật ngay lập tức với dữ liệu mới nhất
      if (targetTagId && responseData) {
        // Cập nhật detail query cache với dữ liệu mới từ response
        queryClient.setQueryData(queryKeys.adminTags.detail(targetTagId), {
          data: responseData,
        })
      }

      // Invalidate React Query cache để đảm bảo tất cả queries được refresh
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminTags.all(), refetchType: "all" })
      
      // Invalidate detail query để đảm bảo detail page được cập nhật
      if (targetTagId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminTags.detail(targetTagId), refetchType: "all" })
      }
      
      // Refetch để đảm bảo data mới nhất từ server
      await queryClient.refetchQueries({ queryKey: queryKeys.adminTags.all(), type: "all" })
      
      if (targetTagId) {
        // Refetch detail query để đảm bảo detail page có data mới nhất
        await queryClient.refetchQueries({ queryKey: queryKeys.adminTags.detail(targetTagId), type: "all" })
      }
      
      // Log success sau khi đã cập nhật cache
      resourceLogger.actionFlow({
        resource: "tags",
        action: "update",
        step: "success",
        metadata: {
          tagId: targetTagId,
          responseStatus: response?.status,
          cacheUpdated: !!responseData,
        },
      })
      
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!tag?.id) {
    return null
  }

  const editFields = getBaseTagFields()

  return (
    <ResourceForm<TagFormData>
      data={tag}
      fields={editFields}
      onSubmit={handleSubmit}
      title="Chỉnh sửa thẻ tag"
      description="Cập nhật thông tin thẻ tag"
      submitLabel="Cập nhật"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      onBack={() => navigateBack(backUrl || `/admin/tags/${tag?.id || ""}`)}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      showCard={variant === "page" ? false : true}
      className={variant === "page" ? "max-w-[100%]" : undefined}
    />
  )
}

