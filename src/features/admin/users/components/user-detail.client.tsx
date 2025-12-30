"use client"

import * as React from "react"
import { Mail, Shield, CheckCircle2, Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { getUserInitials } from "../utils"
import { queryKeys } from "@/lib/query-keys"
import { logger } from "@/lib/config/logger"
import { usePageLoadLogger } from "@/hooks/use-page-load-logger"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { TypographyH4, TypographySpanLarge, TypographySpanMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseUserFields, getUserFormSections, type UserFormData } from "../form-fields"

export interface UserDetailData {
  id: string
  email: string
  name: string | null
  avatar?: string | null
  bio?: string | null
  phone?: string | null
  address?: string | null
  // Structured address fields
  addressStreet?: string | null
  addressWard?: string | null
  addressDistrict?: string | null
  addressCity?: string | null
  addressPostalCode?: string | null
  emailVerified?: string | null
  updatedAt?: string
  createdAt?: string
  isActive: boolean
  roles?: Array<{
    id: string
    name: string
    displayName?: string
  }>
  [key: string]: unknown
}

export interface UserDetailClientProps {
  userId: string
  user: UserDetailData
  backUrl?: string
}

export const UserDetailClient = ({ userId, user, backUrl = "/admin/users" }: UserDetailClientProps) => {
  const router = useResourceRouter()
  const { hasAnyPermission } = usePermissions()

  // Log page load
  usePageLoadLogger("detail")

  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: user,
    resourceId: userId,
    detailQueryKey: queryKeys.adminUsers.detail,
    resourceName: "users",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "users",
    resourceId: userId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const roles: Array<{ id: string; name: string; displayName: string }> = (detailData.roles || []).map(r => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName || r.name,
  }))
  const roleIds = roles.length > 0 ? roles[0].id : ""
  const fields = getBaseUserFields(roles, roleIds)
  const sections = getUserFormSections()
  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <>
      <ResourceForm<UserFormData>
        data={detailData as UserFormData}
        fields={fields}
        sections={sections}
        prefixContent={
          <Flex fullWidth align="center" gap={4} padding="md" rounded="lg" border="all" className="bg-muted/50 border-border/50 mb-4">
            <Flex className="h-24 w-24 relative" fullWidth>
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage
                  src={detailData.avatar || undefined}
                  alt={detailData.name || detailData.email}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-chart-1 text-primary-foreground">
                  <TypographySpanLarge>{getUserInitials(detailData.name, detailData.email)}</TypographySpanLarge>
                </AvatarFallback>
              </Avatar>
              {detailData.isActive && (
                <Flex position="absolute" className="bottom-0 right-0 rounded-full bg-green-500 border-2 border-background" align="center" justify="center">
                  <IconSize size="md">
                    <CheckCircle2 className="text-white" />
                  </IconSize>
                </Flex>
              )}
            </Flex>
            <Flex direction="col" gap={1} flex="1" fullWidth>
              <TypographyH4>{detailData.name || "Chưa có tên"}</TypographyH4>
              <Flex align="center" gap={2} className="text-muted-foreground" fullWidth>
                <IconSize size="sm">
                  <Mail />
                </IconSize>
                <TypographySpanMuted>{detailData.email}</TypographySpanMuted>
              </Flex>
              {detailData.roles && detailData.roles.length > 0 && (
                <Flex wrap align="center" gap={2} fullWidth>
                  {detailData.roles.map((role) => (
                    <Badge
                      key={role.name}
                      variant="outline"
                      className="bg-primary/10 px-2 py-0.5 border-primary/20"
                    >
                      <Flex align="center" gap={1}>
                        <IconSize size="xs">
                          <Shield />
                        </IconSize>
                        <TypographySpanSmall className="text-primary">{role.displayName || role.name}</TypographySpanSmall>
                      </Flex>
                    </Badge>
                  ))}
                </Flex>
              )}
            </Flex>
          </Flex>
        }
        title={detailData.name || detailData.email}
        description={`Chi tiết người dùng ${detailData.email}`}
        backUrl={backUrl}
        backLabel="Quay lại danh sách"
        readOnly={true}
        showCard={false}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
        resourceName="users"
        resourceId={userId}
        action="update"
        footerButtons={
          !isDeleted && canUpdate ? (
            <Button
              variant="outline"
              onClick={() => {
                logger.info("✏️ Edit from detail page", {
                  source: "detail-page-edit-button",
                  resourceId: userId,
                  resourceName: "users",
                  targetUrl: `/admin/users/${userId}/edit`,
                })
                router.push(`/admin/users/${userId}/edit`)
              }}
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
    </>
  )
}

