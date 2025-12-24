"use client"

import { User, Globe, MapPin, Calendar, CheckCircle2, XCircle, Edit, Key, RefreshCw, Clock } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { formatDateVi } from "../utils"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { TypographyP, TypographyPSmallMuted, TypographyPSmall, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export interface SessionDetailData {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  userAgent: string | null
  ipAddress: string | null
  isActive: boolean
  expiresAt: string
  lastActivity: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  userName: string | null
  userEmail: string
  [key: string]: unknown
}

export interface SessionDetailClientProps {
  sessionId: string
  session: SessionDetailData
  backUrl?: string
}

export const SessionDetailClient = ({ sessionId, session, backUrl = "/admin/sessions" }: SessionDetailClientProps) => {
  const router = useResourceRouter()
  const { hasAnyPermission } = usePermissions()
  
  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.SESSIONS_UPDATE, PERMISSIONS.SESSIONS_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: session,
    resourceId: sessionId,
    detailQueryKey: queryKeys.adminSessions.detail,
    resourceName: "sessions",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "sessions",
    resourceId: sessionId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const detailFields: ResourceDetailField<SessionDetailData>[] = []

  const detailSections: ResourceDetailSection<SessionDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về session",
      fieldsContent: (_fields, data) => {
        const sessionData = data as SessionDetailData
        
        return (
          <Flex direction="col" gap={6}>
            <FieldItem icon={User} label="Người dùng" iconColor="bg-primary/10">
              <Flex direction="col" gap={0.5}>
                <TypographyP className="text-foreground">
                  {sessionData.userName || sessionData.userEmail || "—"}
                </TypographyP>
                {sessionData.userEmail && sessionData.userName && (
                  <TypographyPSmallMuted>
                    {sessionData.userEmail}
                  </TypographyPSmallMuted>
                )}
              </Flex>
            </FieldItem>
          </Flex>
        )
      },
    },
    {
      id: "security",
      title: "Bảo mật",
      description: "Thông tin bảo mật và mạng",
      fieldsContent: (_fields, data) => {
        const sessionData = data as SessionDetailData
        
        return (
          <Flex direction="col" gap={6}>
            <FieldItem icon={Key} label="Access Token" iconColor="bg-chart-1/10">
              <TypographyPSmall className="font-mono break-all text-foreground">
                {sessionData.accessToken || "—"}
              </TypographyPSmall>
            </FieldItem>

            <FieldItem icon={RefreshCw} label="Refresh Token" iconColor="bg-chart-2/10">
              <TypographyPSmall className="font-mono break-all text-foreground">
                {sessionData.refreshToken || "—"}
              </TypographyPSmall>
            </FieldItem>

            <Grid cols={2} gap={6}>
              <FieldItem icon={Globe} label="User Agent" iconColor="bg-chart-3/10">
                <TypographyP className="break-all text-foreground">
                  {sessionData.userAgent || "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={MapPin} label="IP Address" iconColor="bg-chart-4/10">
                <TypographyP className="text-foreground">
                  {sessionData.ipAddress || "—"}
                </TypographyP>
              </FieldItem>
            </Grid>
          </Flex>
        )
      },
    },
    {
      id: "status",
      title: "Trạng thái và thời gian",
      description: "Trạng thái hoạt động và thông tin thời gian",
      fieldsContent: (_fields, data) => {
        const sessionData = data as SessionDetailData
        
        return (
          <Flex direction="col" gap={6}>
            <FieldItem 
              icon={sessionData.isActive ? CheckCircle2 : XCircle} 
              label="Trạng thái"
              iconColor={sessionData.isActive ? "bg-green-500/10" : "bg-red-500/10"}
            >
              <Badge 
                variant={sessionData.isActive ? "default" : "secondary"}
                className={cn(
                  sessionData.isActive
                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20"
                    : "bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20"
                )}
              >
                {sessionData.isActive ? "Hoạt động" : "Tạm khóa"}
              </Badge>
            </FieldItem>

            <Grid cols={2} gap={6}>
              <FieldItem icon={Calendar} label="Thời gian hết hạn">
                <TypographyP className="text-foreground">
                  {sessionData.expiresAt ? formatDateVi(sessionData.expiresAt) : "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Clock} label="Hoạt động cuối">
                <TypographyP className="text-foreground">
                  {sessionData.lastActivity ? formatDateVi(sessionData.lastActivity) : "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Calendar} label="Ngày tạo">
                <TypographyP className="text-foreground">
                  {sessionData.createdAt ? formatDateVi(sessionData.createdAt) : "—"}
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
    <ResourceDetailClient<SessionDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={`Session ${detailData.userName || detailData.userEmail || detailData.id}`}
      description={`Chi tiết phiên đăng nhập của ${session.userName || session.userEmail || "người dùng"}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/sessions/${sessionId}/edit`)}
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

