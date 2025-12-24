"use client"

import { Tag, Hash, AlignLeft, Calendar, Clock, Edit } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { formatDateVi } from "../utils"
import { queryKeys } from "@/lib/query-keys"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { TypographyP, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export interface CategoryDetailData {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface CategoryDetailClientProps {
  categoryId: string
  category: CategoryDetailData
  backUrl?: string
}

export const CategoryDetailClient = ({ categoryId, category, backUrl = "/admin/categories" }: CategoryDetailClientProps) => {
  const { navigateBack, router } = useResourceNavigation({
    invalidateQueryKey: queryKeys.adminCategories.all(),
  })
  const { hasAnyPermission } = usePermissions()
  
  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.CATEGORIES_UPDATE, PERMISSIONS.CATEGORIES_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: category,
    resourceId: categoryId,
    detailQueryKey: queryKeys.adminCategories.detail,
    resourceName: "categories",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "categories",
    resourceId: categoryId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const detailFields: ResourceDetailField<CategoryDetailData>[] = []

  const detailSections: ResourceDetailSection<CategoryDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về danh mục và thời gian",
      fieldsContent: (_fields, data) => {
        const categoryData = data as CategoryDetailData
        
        return (
          <Flex direction="col" gap={6}>
            {/* Name & Slug */}
            <Grid cols={2} gap={6}>
              <FieldItem icon={Tag} label="Tên danh mục">
                <TypographyP>
                  {categoryData.name || "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Hash} label="Slug">
                <TypographyP className="font-mono">
                  {categoryData.slug || "—"}
                </TypographyP>
              </FieldItem>
            </Grid>

            {/* Description */}
            {categoryData.description && (
              <Card className="border border-border/50 bg-card p-5">
                <Flex align="start" gap={3}>
                  <Flex align="center" justify="center" className="h-9 w-9 shrink-0 rounded-lg bg-muted">
                    <IconSize size="sm">
                      <AlignLeft />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={2} className="flex-1 min-w-0">
                    <TypographyP>Mô tả</TypographyP>
                    <TypographyP>
                      {categoryData.description || "—"}
                    </TypographyP>
                  </Flex>
                </Flex>
              </Card>
            )}

            {/* Timestamps */}
            <Grid cols={2} gap={6}>
              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographyP>
                  {categoryData.createdAt ? formatDateVi(categoryData.createdAt) : "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographyP>
                  {categoryData.updatedAt ? formatDateVi(categoryData.updatedAt) : "—"}
                </TypographyP>
              </FieldItem>
            </Grid>
          </Flex>
        )
      },
    },
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceDetailClient<CategoryDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.name}
      description={`Chi tiết danh mục ${detailData.slug}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={() => navigateBack(backUrl)}
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/categories/${categoryId}/edit`)}
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

