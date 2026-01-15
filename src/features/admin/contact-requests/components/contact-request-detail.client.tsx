"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { Edit, CheckCircle2, XCircle } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useResourceRouter } from "@/hooks"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/constants"
import { usePermissions } from "@/features/auth"
import { PERMISSIONS } from "@/permissions"
import { useContactRequestActions } from "../hooks/use-contact-request-actions"
import { useContactRequestFeedback } from "../hooks/use-contact-request-feedback"
import { CONTACT_REQUEST_LABELS } from "../constants"
import { TypographyPMuted, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseContactRequestFields, getContactRequestFormSections, type ContactRequestFormData } from "../form-fields"
import type { ContactRequestRow, ContactStatus, ContactPriority } from "../types"

export interface ContactRequestDetailData {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  content: string
  status: string
  priority: string
  isRead: boolean
  assignedToId: string | null
  assignedTo: {
    id: string
    name: string | null
    email: string
  } | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  [key: string]: unknown
}

export interface ContactRequestDetailClientProps {
  contactRequestId: string
  contactRequest: ContactRequestDetailData
  backUrl?: string
}

export const ContactRequestDetailClient = ({ contactRequestId, contactRequest, backUrl = "/admin/contact-requests" }: ContactRequestDetailClientProps) => {
  const router = useResourceRouter()
  const { hasAnyPermission } = usePermissions()
  const { showFeedback } = useContactRequestFeedback()

  // Check permissions
  const canUpdate = hasAnyPermission([PERMISSIONS.CONTACT_REQUESTS_UPDATE, PERMISSIONS.CONTACT_REQUESTS_MANAGE])
  const canDelete = hasAnyPermission([PERMISSIONS.CONTACT_REQUESTS_MANAGE])
  const canRestore = hasAnyPermission([PERMISSIONS.CONTACT_REQUESTS_MANAGE])
  const canManage = hasAnyPermission([PERMISSIONS.CONTACT_REQUESTS_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: contactRequest,
    resourceId: contactRequestId,
    detailQueryKey: queryKeys.adminContactRequests.detail,
    resourceName: "contact-requests",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "contact-requests",
    resourceId: contactRequestId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const { executeSingleAction, markingReadIds } = useContactRequestActions({
    canDelete,
    canRestore,
    canManage,
    isSocketConnected: false,
    showFeedback,
  })

  const [isToggling, setIsToggling] = useState(false)

  const handleToggleReadStatus = useCallback(
    async (checked: boolean) => {
      if (!canUpdate) {
        return
      }

      setIsToggling(true)
      try {
        // Create a mock row object for handleToggleRead
        const mockRow: ContactRequestRow = {
          id: contactRequestId,
          name: detailData.name,
          email: detailData.email,
          phone: detailData.phone,
          subject: detailData.subject,
          status: detailData.status as ContactStatus,
          priority: detailData.priority as ContactPriority,
          isRead: detailData.isRead,
          assignedToName: detailData.assignedTo?.name || null,
          createdAt: detailData.createdAt,
          updatedAt: detailData.updatedAt,
          deletedAt: detailData.deletedAt,
        }

        // executeSingleAction sẽ hiển thị toast tự động
        await executeSingleAction(checked ? "mark-read" : "mark-unread", mockRow)
      } catch {
        // Error đã được xử lý trong executeSingleAction với toast
      } finally {
        setIsToggling(false)
      }
    },
    [canUpdate, contactRequestId, detailData, executeSingleAction],
  )

  const fields = getBaseContactRequestFields([])
  const sections = getContactRequestFormSections()
  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceForm<ContactRequestFormData>
      data={detailData as ContactRequestFormData}
      fields={fields}
      sections={sections}
      title={detailData.subject}
      description={`Yêu cầu liên hệ từ ${detailData.name}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      readOnly={true}
      showCard={false}
      onSubmit={async () => ({ success: false, error: "Read-only mode" })}
      suffixContent={
        <Flex
          align="center"
          justify="between"
          gap={2}
          fullWidth
          border="top"
          padding="sm-y"
        >
          <Flex align="center" gap={3}>
            <IconSize size="sm">
              {detailData.isRead ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-amber-600" />}
            </IconSize>
            <Flex direction="col" gap={0.5}>
              <TypographyPMuted className="font-medium">Trạng thái đọc</TypographyPMuted>
              <TypographyPSmallMuted>
                {detailData.isRead ? CONTACT_REQUEST_LABELS.READ : CONTACT_REQUEST_LABELS.UNREAD}
              </TypographyPSmallMuted>
            </Flex>
          </Flex>
          <Flex align="center" gap={3}>
            <Switch
              checked={detailData.isRead}
              disabled={isToggling || markingReadIds.has(contactRequestId) || !canUpdate}
              onCheckedChange={handleToggleReadStatus}
              aria-label={detailData.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
            />
            {!canUpdate && (
              <TypographyPSmallMuted>
                Bạn không có quyền thay đổi
              </TypographyPSmallMuted>
            )}
          </Flex>
        </Flex>
      }
      footerButtons={
        !isDeleted && canUpdate ? (
          <Button
            variant="default"
            onClick={() => router.push(`/admin/contact-requests/${contactRequestId}/edit`)}
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
      resourceName="contact-requests"
      resourceId={contactRequestId}
      action="update"
    />
  )
}

