"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit, useResourceNavigation, useResourceDetailData } from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
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
  tag: initialTag,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  tagId,
}: TagEditClientProps) {
  const queryClient = useQueryClient()
  const { navigateBack } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminTags.all(),
  })

  // Fetch fresh data từ API để đảm bảo data chính xác (theo chuẩn Next.js 16)
  // Luôn fetch khi có resourceId để đảm bảo data mới nhất, không phụ thuộc vào variant
  const resourceId = tagId || initialTag?.id
  const { data: tagData } = useResourceDetailData({
    initialData: initialTag || ({} as TagEditData),
    resourceId: resourceId || "",
    detailQueryKey: queryKeys.adminTags.detail,
    resourceName: "tags",
    fetchOnMount: !!resourceId, // Luôn fetch khi có resourceId để đảm bảo data fresh
  })

  // Transform data từ API response sang form format
  // Note: Tag API đã trả về name, slug trực tiếp, không cần transform như posts
  // Sử dụng useMemo để tối ưu hóa và đảm bảo data được xử lý đúng cách
  const tag = useMemo(() => {
    if (tagData) {
      return tagData as TagEditData
    }
    return initialTag || null
  }, [tagData, initialTag])
  
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
    onSuccess: createResourceEditOnSuccess({
      queryClient,
      resourceId: tag?.id,
      allQueryKey: queryKeys.adminTags.all(),
      detailQueryKey: queryKeys.adminTags.detail,
      resourceName: "tags",
      getRecordName: (data) => data.name as string | undefined,
      onSuccess,
    }),
  })

  if (!tag?.id) {
    return null
  }

  // Check nếu tag đã bị xóa - redirect về detail page (vẫn cho xem nhưng không được chỉnh sửa)
  const isDeleted = tag.deletedAt !== null && tag.deletedAt !== undefined

  // Disable form khi record đã bị xóa (cho dialog/sheet mode)
  const formDisabled = isDeleted && variant !== "page"
  
  // Wrap handleSubmit để prevent submit khi deleted
  const handleSubmitWrapper = async (data: Partial<TagFormData>) => {
    if (isDeleted) {
      return { success: false, error: "Bản ghi đã bị xóa, không thể chỉnh sửa" }
    }
    return handleSubmit(data)
  }

  const editFields = getBaseTagFields()

  return (
    <ResourceForm<TagFormData>
      data={tag}
      fields={editFields.map(field => ({ ...field, disabled: formDisabled || field.disabled }))}
      onSubmit={handleSubmitWrapper}
      title="Chỉnh sửa thẻ tag"
      description={isDeleted ? "Bản ghi đã bị xóa, không thể chỉnh sửa" : "Cập nhật thông tin thẻ tag"}
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
      resourceName="tags"
      resourceId={tag?.id}
      action="update"
    />
  )
}

