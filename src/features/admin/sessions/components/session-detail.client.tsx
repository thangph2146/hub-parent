"use client"

import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
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
    <>
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
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/sessions/${sessionId}/edit`)}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Edit />
              </IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        </Flex>
      )}
    </>
  )
}

