"use client"

import type React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Shield, FileText, Calendar, Clock, CheckCircle2, XCircle, Edit } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { formatDateVi } from "../utils"
import { getAllPermissionsOptionGroups } from "../form-fields"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { PermissionsTableField } from "@/features/admin/resources/components/form-fields/permissions-table-field"
import { cn } from "@/lib/utils"
import { TypographySpanMuted, TypographyH3, TypographyP, TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

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

  // Get grouped permissions
  const permissionsGroups = getAllPermissionsOptionGroups()

  const detailFields: ResourceDetailField<RoleDetailData>[] = []

  const detailSections: ResourceDetailSection<RoleDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về vai trò",
      fieldsContent: (_fields, data) => {
        const roleData = (data || detailData) as RoleDetailData
        
        return (
          <Flex direction="col" fullWidth gap="responsive">
            <Grid cols="responsive-2" fullWidth gap="responsive">
              <FieldItem icon={Shield} label="Tên vai trò">
                <TypographySpanMuted>{roleData.name || "—"}</TypographySpanMuted>
              </FieldItem>
              <FieldItem icon={FileText} label="Tên hiển thị">
                <TypographySpanMuted>{roleData.displayName || "—"}</TypographySpanMuted>
              </FieldItem>
            </Grid>
            {roleData.description && (
              <Card className="border border-border/50">
                <Flex align="start" fullWidth gap={3} padding="lg">
                  <Flex align="center" justify="center" shrink className="h-9 w-9" rounded="lg" bg="muted">
                    <IconSize size="sm"><FileText /></IconSize>
                  </Flex>
                  <Flex direction="col" fullWidth gap={2} flex="1" minWidth="0">
                    <TypographyH3>Mô tả</TypographyH3>
                    <TypographyP className="leading-relaxed whitespace-pre-wrap break-words">
                      {roleData.description || "—"}
                    </TypographyP>
                  </Flex>
                </Flex>
              </Card>
            )}
          </Flex>
        )
      },
    },
    {
      id: "permissions",
      title: "Quyền truy cập",
      description: "Danh sách quyền được gán cho vai trò",
              fieldsContent: (_fields, data) => {
        const roleData = (data || detailData) as RoleDetailData
        
        if (!roleData.permissions || !Array.isArray(roleData.permissions) || roleData.permissions.length === 0) {
          return (
            <Flex align="center" gap={3} fullWidth>
              <Flex align="center" justify="center" shrink className="h-9 w-9" rounded="lg" bg="muted">
                <IconSize size="sm">
                  <Shield />
                </IconSize>
              </Flex>
              <Flex direction="col" gap={2} flex="1" minWidth="0">
                <TypographySpanSmallMuted>Quyền</TypographySpanSmallMuted>
                <TypographySpanMuted>—</TypographySpanMuted>
              </Flex>
            </Flex>
          )
        }

        // Create a mock field object for PermissionsTableField
        const mockField = {
          name: "permissions",
          label: "Quyền",
          type: "permissions-table" as const,
          optionGroups: permissionsGroups.map((group) => ({
            label: group.label,
            options: group.options.map((opt) => ({
              label: opt.label,
              value: opt.value,
            })),
          })),
          disabled: true, // Read-only mode
        }

        return (
          <PermissionsTableField
            field={mockField}
            fieldValue={roleData.permissions}
            onChange={() => {}} // No-op since it's read-only
            isPending={false}
            availablePermissions={roleData.permissions}
            readOnly={true}
          />
        )
      },
    },
    {
      id: "status",
      title: "Trạng thái và thời gian",
      description: "Trạng thái hoạt động và thông tin thời gian",
      fieldsContent: (_fields, data) => {
        const roleData = (data || detailData) as RoleDetailData
        
        return (
          <Flex direction="col" gap="responsive">
            {/* Status */}
            <FieldItem 
              icon={roleData.isActive ? CheckCircle2 : XCircle} 
              label="Trạng thái"
            >
              <Badge
                  className={cn(
                  "w-fit px-2.5 py-1",
                  roleData.isActive
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20"
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20"
                )}
                variant={roleData.isActive ? "default" : "secondary"}
              >
                {roleData.isActive ? (
                  <>
                    <Flex align="center" gap={1.5}>
                      <IconSize size="xs">
                        <CheckCircle2 />
                      </IconSize>
                      Hoạt động
                    </Flex>
                  </> 
                ) : (
                  <>
                    <Flex align="center" gap={1.5}>
                      <IconSize size="xs">
                        <XCircle />
                      </IconSize>
                      Tạm khóa
                    </Flex>
                  </>
                )}
              </Badge>
            </FieldItem>

            {/* Timestamps */}
            <Grid cols="responsive-2" gap="responsive" fullWidth>
              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographySpanMuted>
                  {roleData.createdAt ? formatDateVi(roleData.createdAt) : "—"}
                </TypographySpanMuted>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographySpanMuted>
                  {roleData.updatedAt ? formatDateVi(roleData.updatedAt) : "—"}
                </TypographySpanMuted>
              </FieldItem>
            </Grid>
          </Flex>
        )
      },
    },
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceDetailClient<RoleDetailData>
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.displayName}
      description={`Chi tiết vai trò ${detailData.name}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      onBack={() => navigateBack(backUrl)}
      data={detailData}
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
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
    />
  )
}

