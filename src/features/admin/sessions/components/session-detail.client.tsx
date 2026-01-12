"use client"

import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceRouter } from "@/hooks"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/constants"
import { usePermissions } from "@/features/auth"
import { PERMISSIONS } from "@/permissions"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseSessionFields, getSessionFormSections, type SessionFormData } from "../form-fields"

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

  const fields = getBaseSessionFields([])
  const sections = getSessionFormSections()
  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceForm<SessionFormData>
      data={detailData as SessionFormData}
      fields={fields}
      sections={sections}
      title={`Session ${detailData.userName || detailData.userEmail || detailData.id}`}
      description={`Chi tiết phiên đăng nhập của ${session.userName || session.userEmail || "người dùng"}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      readOnly={true}
      showCard={false}
      onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      footerButtons={
        !isDeleted && canUpdate ? (
          <Button
            variant="default"
            onClick={() => router.push(`/admin/sessions/${sessionId}/edit`)}
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
      resourceName="sessions"
      resourceId={sessionId}
      action="update"
    />
  )
}

