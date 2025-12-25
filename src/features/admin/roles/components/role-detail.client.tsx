"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Shield, FileText, Calendar, Clock, CheckCircle2, XCircle, Edit, ChevronsUpDown, Check } from "lucide-react"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { TypographySpanMuted, TypographyH3, TypographyP, TypographySpanSmallMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography"
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
  const [permissionsOpen, setPermissionsOpen] = React.useState(false)
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
  
  // Get all options from groups
  const allPermissionsOptions = permissionsGroups.flatMap((group) => group.options)
  

  const detailFields: ResourceDetailField<RoleDetailData>[] = []

  const detailSections: ResourceDetailSection<RoleDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về vai trò",
      fieldsContent: (_fields, data) => {
        const roleData = (data || detailData) as RoleDetailData
        
        return (
          <Flex direction="col" fullWidth gap={6}>
            <Grid cols={2} fullWidth gap={6}>
              <FieldItem icon={Shield} label="Tên vai trò">
                <TypographySpanMuted className="text-foreground">{roleData.name || "—"}</TypographySpanMuted>
              </FieldItem>
              <FieldItem icon={FileText} label="Tên hiển thị">
                <TypographySpanMuted className="text-foreground">{roleData.displayName || "—"}</TypographySpanMuted>
              </FieldItem>
            </Grid>
            {roleData.description && (
              <Card className="border border-border/50" padding="lg">
                <Flex align="start" fullWidth gap={3}>
                  <Flex align="center" justify="center" shrink className="h-9 w-9" rounded="lg" bg="muted">
                    <IconSize size="sm"><FileText className="text-muted-foreground" /></IconSize>
                  </Flex>
                  <Flex direction="col" fullWidth gap={2} flex="1" minWidth="0">
                    <TypographyH3 className="text-foreground">Mô tả</TypographyH3>
                    <TypographyP className="leading-relaxed whitespace-pre-wrap text-foreground break-words">
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
            <Flex align="center" gap={3}>
              <Flex align="center" justify="center" shrink className="h-9 w-9" rounded="lg" bg="muted">
                <IconSize size="sm">
                  <Shield className="text-muted-foreground" />
                </IconSize>
              </Flex>
              <Flex direction="col" gap={2} flex="1" minWidth="0">
                <TypographySpanSmallMuted>Quyền</TypographySpanSmallMuted>
                <TypographySpanMuted>—</TypographySpanMuted>
              </Flex>
            </Flex>
          )
        }

        const selectedValues = roleData.permissions.map((v) => String(v))
        
        // Get selected permissions with labels
        const selectedPermissions = roleData.permissions
          .map((perm) => {
            const option = allPermissionsOptions.find((opt) => opt.value === perm)
            return option ? { value: perm, label: option.label } : null
          })
          .filter((p): p is { value: string; label: string } => p !== null)

        const displayText = selectedPermissions.length > 0
          ? `${selectedPermissions.length} quyền đã chọn`
          : `${roleData.permissions.length} quyền đã chọn`

        return (
          <Flex direction="col" gap={4} fullWidth>
            <Flex align="start" gap={3} fullWidth>
              <Flex align="center" justify="center" shrink className="h-9 w-9" rounded="lg" bg="muted">
                <IconSize size="sm">
                  <Shield className="text-muted-foreground" />
                </IconSize>
              </Flex>
              <Flex direction="col" gap={3} flex="1" minWidth="0">
                <Flex direction="col" gap={2}>
                  <TypographySpanSmallMuted>Quyền</TypographySpanSmallMuted>
                  <Popover open={permissionsOpen} onOpenChange={setPermissionsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={permissionsOpen}
                        className="w-full justify-between"
                      >
                        <Flex align="center" justify="between" fullWidth gap={2}>
                          <TypographySpanSmall className="truncate">{displayText}</TypographySpanSmall>
                          <IconSize size="sm" className="shrink-0 opacity-50">
                            <ChevronsUpDown />
                          </IconSize>
                        </Flex>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm quyền..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy quyền.</CommandEmpty>
                          {permissionsGroups.map((group, groupIndex) => {
                            const groupSelectedCount = group.options.filter((opt) =>
                              selectedValues.includes(String(opt.value))
                            ).length
                            
                            if (groupSelectedCount === 0) return null

                            return (
                              <CommandGroup key={`${groupIndex}-${group.label}`} heading={group.label}>
                                {group.options.map((option, optionIndex) => {
                                  const isSelected = selectedValues.includes(String(option.value))
                                  if (!isSelected) return null
                                  
                                  return (
                                    <CommandItem
                                      key={`${groupIndex}-${optionIndex}-${option.value}`}
                                      value={String(option.value)}
                                      disabled
                                      className="cursor-default"
                                    >
                                      <Flex align="center" gap={2}>
                                        <IconSize size="sm" className="opacity-100">
                                          <Check />
                                        </IconSize>
                                        {option.label}
                                      </Flex>
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            )
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </Flex>
                <Flex wrap gap={2}>
                  {selectedPermissions.slice(0, 5).map((perm) => (
                    <Badge key={perm.value} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {perm.label}
                    </Badge>
                  ))}
                  {selectedPermissions.length > 5 && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      +{selectedPermissions.length - 5} quyền khác
                    </Badge>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
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
          <Flex direction="col" gap={6} fullWidth>
            {/* Status */}
            <FieldItem 
              icon={roleData.isActive ? CheckCircle2 : XCircle} 
              label="Trạng thái"
            >
              <Badge
                  className={cn(
                  "px-2.5 py-1",
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
            <Grid cols={2} gap={6} fullWidth>
              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographySpanMuted className="text-foreground">
                  {roleData.createdAt ? formatDateVi(roleData.createdAt) : "—"}
                </TypographySpanMuted>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographySpanMuted className="text-foreground">
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

