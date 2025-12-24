"use client"

import * as React from "react"
import { Mail, User, Shield, Phone, MapPin, Calendar, Clock, CheckCircle2, XCircle, FileText, Edit, Building2, Navigation } from "lucide-react"
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
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

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

// Helper function to parse JSON string or object
const parseAddressValue = (value: unknown): string | null => {
  if (!value) return null
  
  // If it's already a string
  if (typeof value === "string") {
    const trimmed = value.trim()
    // If it's a JSON string, try to parse it
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed)
        // If parsed is an object, extract values
        if (typeof parsed === "object" && parsed !== null) {
          // Try common address field names
          const addressFields = [
            "postalCode", "postal_code", "postal",
            "street", "ward", "district", "city",
            "addressStreet", "addressWard", "addressDistrict", "addressCity", "addressPostalCode"
          ]
          for (const field of addressFields) {
            if (parsed[field] && typeof parsed[field] === "string") {
              return parsed[field].trim()
            }
          }
          // If no known field, return first string value
          const firstValue = Object.values(parsed).find(v => typeof v === "string" && v.trim().length > 0)
          if (firstValue) return String(firstValue).trim()
        }
        return null
      } catch {
        // If parsing fails, return null
        return null
      }
    }
    // Regular string
    return trimmed.length > 0 ? trimmed : null
  }
  
  // If it's an object, extract values
  if (typeof value === "object" && value !== null) {
    const addressFields = [
      "postalCode", "postal_code", "postal",
      "street", "ward", "district", "city",
      "addressStreet", "addressWard", "addressDistrict", "addressCity", "addressPostalCode"
    ]
    for (const field of addressFields) {
      if ((value as Record<string, unknown>)[field] && typeof (value as Record<string, unknown>)[field] === "string") {
        return String((value as Record<string, unknown>)[field]).trim()
      }
    }
    // If no known field, return first string value
    const firstValue = Object.values(value).find(v => typeof v === "string" && v.trim().length > 0)
    if (firstValue) return String(firstValue).trim()
  }
  
  return null
}

// Helper function to validate and get address field value
const getAddressFieldValue = (value: unknown): string | null => {
  return parseAddressValue(value)
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
        <Flex align="center" gap={4} className="p-4 bg-muted/50 rounded-lg border border-border/50">
          <Flex className="h-24 w-24 relative">
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
              <div className="absolute bottom-0 right-0 rounded-full bg-green-500 border-2 border-background">
                <IconSize size="md">
                  <CheckCircle2 className="text-white" />
                </IconSize>
              </div>
            )}
          </Flex>
          <Flex direction="col" gap={1} className="flex-1">
            <TypographyH4>{detailData.name || "Chưa có tên"}</TypographyH4>
            <Flex align="center" gap={2} className="text-muted-foreground">
              <IconSize size="sm">
                <Mail />
              </IconSize>
              <TypographySpanMuted>{detailData.email}</TypographySpanMuted>
            </Flex>
            {detailData.roles && detailData.roles.length > 0 && (
              <Flex wrap={true} align="center" gap={2}>
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
      ),
      fieldsContent: (_fields, data) => {
        const userData = data as UserDetailData
        
        return (
          <Grid cols={2} gap={6}>
            {/* Email */}
            <FieldItem icon={Mail} label="Email">
              <Flex direction="col" gap={1}>
                <TypographySpanMuted>
                  {userData.email || "—"}
                </TypographySpanMuted>
                {userData.emailVerified && (
                  <Flex align="center" gap={2}>
                    <IconSize size="xs">
                      <CheckCircle2 className="text-green-600 dark:text-green-500" />
                    </IconSize>
                    <TypographySpanSmallMuted>Đã xác thực</TypographySpanSmallMuted>
                  </Flex>
                )}
              </Flex>
            </FieldItem>

            {/* Email Verified */}
            {userData.emailVerified && (
              <FieldItem icon={Clock} label="Email đã xác thực">
                <TypographySpanMuted>
                  {formatDateVi(userData.emailVerified)}
                </TypographySpanMuted>
              </FieldItem>
            )}

            {/* Name */}
            <FieldItem icon={User} label="Tên">
              <TypographySpanMuted>
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
          </Grid>
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
          <Flex direction="col" gap={6}>
            {/* Bio */}
            {userData.bio && (
              <Card className="border border-border/50 bg-card p-5">
                <Flex align="start" gap={3}>
                  <Flex align="center" justify="center" className="h-9 w-9 shrink-0 rounded-lg bg-muted">
                    <IconSize size="sm">
                      <FileText />
                    </IconSize>
                  </Flex>
                  <Flex direction="col" gap={2} className="flex-1 min-w-0">
                    <TypographyH3>Giới thiệu</TypographyH3>
                    <TypographyP>
                      {userData.bio || "—"}
                    </TypographyP>
                  </Flex>
                </Flex>
              </Card>
            )}

            {/* Address */}
            {(() => {
              // Parse and extract address values
              const addressValue = getAddressFieldValue(userData.address)
              const streetValue = getAddressFieldValue(userData.addressStreet)
              const wardValue = getAddressFieldValue(userData.addressWard)
              const districtValue = getAddressFieldValue(userData.addressDistrict)
              const cityValue = getAddressFieldValue(userData.addressCity)
              const postalCodeValue = getAddressFieldValue(userData.addressPostalCode)
              
              // Also check if postalCode is in JSON format in any field
              const parsedPostalCode = postalCodeValue || 
                (userData.addressPostalCode ? getAddressFieldValue(userData.addressPostalCode) : null)
              
              const hasStructuredAddress = !!(streetValue || wardValue || districtValue || cityValue || parsedPostalCode)
              const shouldShowAddress = !!(addressValue || hasStructuredAddress)

              if (!shouldShowAddress) return null

              return (
                <Card className="border border-border/50 bg-card p-5">
                  <Flex direction="col" gap={4}>
                    <Flex align="start" gap={3}>
                      <Flex align="center" justify="center" className="h-9 w-9 shrink-0 rounded-lg bg-muted">
                        <IconSize size="sm">
                          <MapPin />
                        </IconSize>
                      </Flex>
                      <Flex direction="col" gap={1} className="flex-1 min-w-0">
                        <TypographyH3>Địa chỉ</TypographyH3>
                        {/* Show legacy address only if no structured address fields */}
                        {addressValue && !hasStructuredAddress && (
                          <TypographyPMuted>{addressValue}</TypographyPMuted>
                        )}
                      </Flex>
                    </Flex>
                    
                    {/* Structured address fields */}
                    {hasStructuredAddress && (
                      <Grid cols={2} gap={4} className="pt-2 border-t border-border/50">
                        {streetValue && (
                          <FieldItem icon={MapPin} label="Số nhà, Đường">
                            <TypographySpanMuted>
                              {streetValue}
                            </TypographySpanMuted>
                          </FieldItem>
                        )}
                        {wardValue && (
                          <FieldItem icon={Building2} label="Phường/Xã">
                            <TypographySpanMuted>
                              {wardValue}
                            </TypographySpanMuted>
                          </FieldItem>
                        )}
                        {districtValue && (
                          <FieldItem icon={Navigation} label="Quận/Huyện">
                            <TypographySpanMuted>
                              {districtValue}
                            </TypographySpanMuted>
                          </FieldItem>
                        )}
                        {cityValue && (
                          <FieldItem icon={MapPin} label="Thành phố/Tỉnh">
                            <TypographySpanMuted>
                              {cityValue}
                            </TypographySpanMuted>
                          </FieldItem>
                        )}
                        {parsedPostalCode && (
                          <FieldItem icon={MapPin} label="Mã bưu điện">
                            <TypographySpanMuted>
                              {parsedPostalCode}
                            </TypographySpanMuted>
                          </FieldItem>
                        )}
                      </Grid>
                    )}
                  </Flex>
                </Card>
              )
            })()}

            {/* Roles */}
            {userData.roles && userData.roles.length > 0 && (
              <FieldItem icon={Shield} label="Vai trò">
                <Flex wrap={true} gap={2}>
                  {userData.roles.map((role) => (
                    <Badge
                      key={role.name}
                      variant="outline"
                      className="bg-primary/10 px-2.5 py-1 text-primary border-primary/20"
                    >
                      <Flex align="center" gap={1}>
                        <IconSize size="xs">
                          <Shield />
                        </IconSize>
                        <TypographySpanSmall>{role.displayName || role.name}</TypographySpanSmall>
                      </Flex>
                    </Badge>
                  ))}
                </Flex>
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
                  <Flex align="center" gap={2}>
                    <IconSize size="xs">
                      <CheckCircle2 />
                    </IconSize>
                    <TypographySpanSmall>Đang hoạt động</TypographySpanSmall>
                  </Flex>
                ) : (
                  <Flex align="center" gap={2}>
                    <IconSize size="xs">
                      <XCircle />
                    </IconSize>
                    <TypographySpanSmall>Đã vô hiệu hóa</TypographySpanSmall>
                  </Flex>
                )}
              </Badge>
            </FieldItem>

            {/* Timestamps */}
            <Grid cols={2} gap={6}>
              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographySpanMuted>
                  {userData.createdAt ? formatDateVi(userData.createdAt) : "—"}
                </TypographySpanMuted>
              </FieldItem>

              <FieldItem icon={Clock} label="Cập nhật lần cuối">
                <TypographySpanMuted>
                  {userData.updatedAt ? formatDateVi(userData.updatedAt) : "—"}
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

