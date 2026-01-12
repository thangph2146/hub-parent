"use client"

import type React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/constants"
import { usePermissions } from "@/features/auth"
import { PERMISSIONS } from "@/permissions"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseRoleFields, getRoleFormSections, type RoleFormData } from "../form-fields"

export interface RoleDetailData {
  id: string
  name: string
  displayName: string
  description: string | null
  permissions: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface RoleDetailClientProps {
  roleId: string
  role: RoleDetailData
  backUrl?: string
}

export const RoleDetailClient = ({ roleId, role, backUrl = "/admin/roles" }: RoleDetailClientProps) => {
  const queryClient = useQueryClient()
  const { navigateBack, router } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminRoles.all(),
  })
  const { hasAnyPermission } = usePermissions()
  
  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: role,
    resourceId: roleId,
    detailQueryKey: queryKeys.adminRoles.detail,
    resourceName: "roles",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "roles",
    resourceId: roleId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const fields = getBaseRoleFields()
  const sections = getRoleFormSections()
  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceForm<RoleFormData>
      data={detailData as RoleFormData}
      fields={fields}
      sections={sections}
      title={detailData.displayName}
      description={`Chi tiết vai trò ${detailData.name}`}
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
            onClick={() => router.push(`/admin/roles/${roleId}/edit`)}
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
      resourceName="roles"
      resourceId={roleId}
      action="update"
    />
  )
}

