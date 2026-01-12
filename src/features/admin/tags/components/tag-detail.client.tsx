"use client"

import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query-keys"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { usePermissions } from "@/features/auth"
import { PERMISSIONS } from "@/lib/permissions"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseTagFields, getTagFormSections, type TagFormData } from "../form-fields"

export interface TagDetailData {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface TagDetailClientProps {
  tagId: string
  tag: TagDetailData
  backUrl?: string
}

export const TagDetailClient = ({ tagId, tag, backUrl = "/admin/tags" }: TagDetailClientProps) => {
  const { navigateBack, router } = useResourceNavigation({
    invalidateQueryKey: queryKeys.adminTags.all(),
  })
  const { hasAnyPermission } = usePermissions()
  
  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.TAGS_UPDATE, PERMISSIONS.TAGS_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: tag,
    resourceId: tagId,
    detailQueryKey: queryKeys.adminTags.detail,
    resourceName: "tags",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "tags",
    resourceId: tagId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const fields = getBaseTagFields()
  const sections = getTagFormSections()
  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceForm<TagFormData>
      data={detailData as TagFormData}
      fields={fields}
      sections={sections}
      title={detailData.name}
      description={`Chi tiết thẻ tag ${detailData.slug}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={() => navigateBack(backUrl)}
      readOnly={true}
      showCard={false}
      onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      footerButtons={
        !isDeleted && canUpdate ? (
          <Button
            variant="default"
            onClick={() => router.push(`/admin/tags/${tagId}/edit`)}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Edit />
              </IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        ) : null
      }
      resourceName="tags"
      resourceId={tagId}
      action="update"
    />
  )
}

