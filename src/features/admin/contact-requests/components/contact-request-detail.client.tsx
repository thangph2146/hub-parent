"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { Edit, CheckCircle2, XCircle } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()

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

  const { handleToggleRead, togglingRequests } = useContactRequestActions({
    canDelete,
    canRestore,
    canManage,
    canUpdate,
    isSocketConnected: false,
    showFeedback,
  })

  const [isToggling, setIsToggling] = useState(false)

  const handleToggleReadStatus = useCallback(
    async (checked: boolean) => {
      if (!canUpdate) {
        toast({
          variant: "destructive",
          title: "Không có quyền",
          description: "Bạn không có quyền thay đổi trạng thái đọc của yêu cầu liên hệ này.",
        })
        showFeedback("error", "Không có quyền", "Bạn không có quyền thay đổi trạng thái đọc của yêu cầu liên hệ này.")
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

        await handleToggleRead(mockRow, checked, async () => {
          // Refresh detail data after toggle
          // The query will be invalidated by handleToggleRead
        })

        // Show success toast
        toast({
          variant: "success",
          title: checked ? "Đã đánh dấu đã đọc" : "Đã đánh dấu chưa đọc",
          description: checked
            ? `Yêu cầu liên hệ "${detailData.subject}" đã được đánh dấu là đã đọc.`
            : `Yêu cầu liên hệ "${detailData.subject}" đã được đánh dấu là chưa đọc.`,
        })
      } catch (error) {
        // Show error toast
        toast({
          variant: "destructive",
          title: checked ? "Đánh dấu đã đọc thất bại" : "Đánh dấu chưa đọc thất bại",
          description: error instanceof Error
            ? error.message
            : checked
              ? "Không thể đánh dấu đã đọc yêu cầu liên hệ."
              : "Không thể đánh dấu chưa đọc yêu cầu liên hệ.",
        })
      } finally {
        setIsToggling(false)
      }
    },
    [canUpdate, contactRequestId, detailData, handleToggleRead, showFeedback, toast],
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
              disabled={isToggling || togglingRequests.has(contactRequestId) || !canUpdate}
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

