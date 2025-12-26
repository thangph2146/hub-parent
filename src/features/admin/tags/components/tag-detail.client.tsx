"use client"

import { Tag, Hash, Calendar, Clock, Edit } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/lib/query-keys"
import { formatDateVi } from "../utils"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { TypographyP, IconSize } from "@/components/ui/typography"
import { Grid } from "@/components/ui/grid"
import { Flex } from "@/components/ui/flex"

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

  const detailFields: ResourceDetailField<TagDetailData>[] = []

  const detailSections: ResourceDetailSection<TagDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về thẻ tag và thời gian",
      fieldsContent: (_fields, data) => {
        const tagData = data as TagDetailData
        
        return (
          <Grid cols="responsive-2" fullWidth gap={6}>
            {/* Name & Slug */}
            <FieldItem icon={Tag} label="Tên thẻ tag">
              <TypographyP>
                {tagData.name || "—"}
              </TypographyP>
            </FieldItem>

            <FieldItem icon={Hash} label="Slug">
              <TypographyP className="font-mono">
                {tagData.slug || "—"}
              </TypographyP>
            </FieldItem>

            {/* Timestamps */}
            <FieldItem icon={Calendar} label="Ngày tạo">
              <TypographyP>
                {tagData.createdAt ? formatDateVi(tagData.createdAt) : "—"}
              </TypographyP>
            </FieldItem>

            <FieldItem icon={Clock} label="Cập nhật lần cuối">
              <TypographyP>
                {tagData.updatedAt ? formatDateVi(tagData.updatedAt) : "—"}
              </TypographyP>
            </FieldItem>
          </Grid>
        )
      },
    },
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceDetailClient<TagDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.name}
      description={`Chi tiết thẻ tag ${detailData.slug}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={() => navigateBack(backUrl)}
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
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
    />
  )
}

