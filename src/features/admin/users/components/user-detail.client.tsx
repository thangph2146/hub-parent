"use client"

import * as React from "react"
import { Mail, User, Shield, Phone, MapPin, Calendar, Clock, CheckCircle2, XCircle, FileText, Edit } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { formatDateVi, getUserInitials } from "../utils"
import { cn } from "@/lib/utils"
import { queryKeys } from "@/lib/query-keys"
import { logger } from "@/lib/config/logger"
import { usePageLoadLogger } from "@/hooks/use-page-load-logger"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { TypographyH3, TypographyH4, TypographyP, TypographySpanLarge, TypographySpanMuted, TypographySpanSmallMuted, TypographyPMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography"

export interface UserDetailData {
  id: string
  email: string
  name: string | null
  avatar?: string | null
  bio?: string | null
  phone?: string | null
  address?: string | null
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

  const detailFields: ResourceDetailField<UserDetailData>[] = []

  const detailSections: ResourceDetailSection<UserDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin đăng nhập và cá nhân",
      fieldHeader: (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
          <div className="relative">
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
              <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                <IconSize size="lg">
                  <IconSize size="xs">
                    <CheckCircle2 className="text-white" />
                  </IconSize>
                </IconSize>
              </div>
            )}
          </div>
          <div className="flex-1">
            <TypographyH4>{detailData.name || "Chưa có tên"}</TypographyH4>
            <TypographyPMuted className="flex items-center gap-2 mt-1">
              <IconSize size="sm">
                <Mail />
              </IconSize>
              {detailData.email}
            </TypographyPMuted>
            {detailData.roles && detailData.roles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {detailData.roles.map((role) => (
                  <Badge
                    key={role.name}
                    variant="outline"
                    className="inline-flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 border-primary/20"
                  >
                    <IconSize size="xs">
                      <Shield />
                    </IconSize>
                    <TypographySpanSmall className="text-primary">{role.displayName || role.name}</TypographySpanSmall>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      ),
      fieldsContent: (_fields, data) => {
        const userData = data as UserDetailData
        
        return (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Email */}
            <FieldItem icon={Mail} label="Email">
              <div className="space-y-1">
                <TypographySpanMuted>
                  {userData.email || "—"}
                </TypographySpanMuted>
                {userData.emailVerified && (
                  <div className="flex items-center gap-1.5">
                    <IconSize size="xs">
                      <CheckCircle2 className="text-green-600 dark:text-green-500" />
                    </IconSize>
                    <TypographySpanSmallMuted>Đã xác thực</TypographySpanSmallMuted>
                  </div>
                )}
              </div>
            </FieldItem>

            {/* Email Verified */}
            {userData.emailVerified && (
              <FieldItem icon={Clock} label="Email đã xác thực">
                <TypographySpanMuted className="text-foreground">
                  {formatDateVi(userData.emailVerified)}
                </TypographySpanMuted>
              </FieldItem>
            )}

            {/* Name */}
            <FieldItem icon={User} label="Tên">
              <TypographySpanMuted className="text-foreground">
                {userData.name || "—"}
              </TypographySpanMuted>
            </FieldItem>

            {/* Phone */}
            {userData.phone && (
              <FieldItem icon={Phone} label="Số điện thoại">
                <TypographySpanMuted>
                  {userData.phone}
                </TypographySpanMuted>
              </FieldItem>
            )}
          </div>
        )
      },
    },
    {
      id: "additional",
      title: "Thông tin bổ sung & Hệ thống",
      description: "Thông tin bổ sung, vai trò, trạng thái và thời gian",
      fieldsContent: (_fields, data) => {
        const userData = data as UserDetailData
        
        return (
          <div className="space-y-6">
            {/* Bio */}
            {userData.bio && (
              <Card className="border border-border/50 bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconSize size="sm">
                      <FileText className="text-muted-foreground" />
                    </IconSize>
                  </div>
                  <div className="flex-1 min-w-0">
                    <TypographyH3 className="text-foreground mb-2">Giới thiệu</TypographyH3>
                    <TypographyP className="leading-relaxed whitespace-pre-wrap text-foreground break-words">
                      {userData.bio || "—"}
                    </TypographyP>
                  </div>
                </div>
              </Card>
            )}

            {/* Address */}
            {userData.address && (
              <FieldItem icon={MapPin} label="Địa chỉ">
                <TypographySpanMuted className="text-foreground">
                  {userData.address}
                </TypographySpanMuted>
              </FieldItem>
            )}

            {/* Roles */}
            {userData.roles && userData.roles.length > 0 && (
              <FieldItem icon={Shield} label="Vai trò">
                <div className="flex flex-wrap gap-2">
                  {userData.roles.map((role) => (
                    <Badge
                      key={role.name}
                      variant="outline"
                      className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 text-primary border-primary/20"
                    >
                      <IconSize size="xs">
                      <Shield />
                    </IconSize>
                      {role.displayName || role.name}
                    </Badge>
                  ))}
                </div>
              </FieldItem>
            )}

            {/* Status */}
            <FieldItem 
              icon={userData.isActive ? CheckCircle2 : XCircle} 
              label="Trạng thái"
            >
              <Badge
                className={cn(
                  "px-2.5 py-1",
                  userData.isActive
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20"
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/20"
                )}
                variant={userData.isActive ? "default" : "secondary"}
              >
                {userData.isActive ? (
                  <>
                    <IconSize size="xs" className="mr-1.5">
                      <CheckCircle2 />
                    </IconSize>
                    Đang hoạt động
                  </> 
                ) : (
                  <>
                    <IconSize size="xs" className="mr-1.5">
                      <XCircle />
                    </IconSize>
                    Đã vô hiệu hóa
                  </>
                )}
              </Badge>
            </FieldItem>

            {/* Timestamps */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographySpanMuted className="text-foreground">
                  {userData.createdAt ? formatDateVi(userData.createdAt) : "—"}
                </TypographySpanMuted>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographySpanMuted className="text-foreground">
                  {userData.updatedAt ? formatDateVi(userData.updatedAt) : "—"}
                </TypographySpanMuted>
              </FieldItem>
            </div>
          </div>
        )
      },
    },
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  
  return (
    <ResourceDetailClient<UserDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.name || detailData.email}
      description={`Chi tiết người dùng ${detailData.email}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      actions={
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
            className="gap-2"
          >
            <IconSize size="sm">
              <Edit />
            </IconSize>
            Chỉnh sửa
          </Button>
        ) : null
      }
    />
  )
}

