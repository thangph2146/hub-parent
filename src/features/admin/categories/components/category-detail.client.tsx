"use client"

import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseCategoryFields, getCategoryFormSections, type CategoryFormData } from "../form-fields"

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

  const fields = getBaseCategoryFields()
  const sections = getCategoryFormSections()
  const isDeleted = !!detailData?.deletedAt
  const editUrl = `/admin/categories/${categoryId}/edit`

  return (
    <>
      <ResourceForm<CategoryFormData>
        data={detailData as CategoryFormData}
        fields={fields}
        sections={sections}
        title={detailData?.name}
        description={`Chi tiết danh mục ${detailData?.slug}`}
        backUrl={backUrl}
        backLabel="Quay lại danh sách"
        onBack={() => navigateBack(backUrl)}
        readOnly={true}
        showCard={false}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      />
      {!isDeleted && canUpdate && (
        <Flex
          align="center"
          justify="end"
          gap={2}
          fullWidth
          paddingY={2}
          border="top"
          className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10"
        >
          <Button variant="outline" onClick={() => router.push(editUrl)}>
            <Flex align="center" gap={2}>
              <IconSize size="sm"><Edit /></IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        </Flex>
      )}
    </>
  )
}

