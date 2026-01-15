"use client"

import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/constants"
import { usePermissions } from "@/features/auth"
import { PERMISSIONS } from "@/permissions"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseCategoryFields, getCategoryFormSections, type CategoryFormData } from "../form-fields"
import { useQuery } from "@tanstack/react-query"
import { listCategories } from "../server/queries"

export interface CategoryDetailData {
  id: string
  name: string
  slug: string
  parentId: string | null
  parentName?: string | null
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

  // Lấy danh sách danh mục để hiển thị tên danh mục cha trong read-only mode
  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.adminCategories.list({ page: 1, limit: 1000, status: "active" }),
    queryFn: () => listCategories({ page: 1, limit: 1000, status: "active" }),
  })

  const categories = categoriesData?.data || []

  const fields = getBaseCategoryFields(categories)
  const sections = getCategoryFormSections()
  const isDeleted = !!detailData?.deletedAt
  const editUrl = `/admin/categories/${categoryId}/edit`

  return (
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
      footerButtons={
        !isDeleted && canUpdate ? (
          <Button variant="outline" onClick={() => router.push(editUrl)}>
            <Flex align="center" gap={2}>
              <IconSize size="sm"><Edit /></IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        ) : null
      }
      resourceName="categories"
      resourceId={categoryId}
      action="update"
    />
  )
}

