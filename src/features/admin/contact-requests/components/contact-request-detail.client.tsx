"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { User, Mail, Phone, FileText, MessageSquare, AlertCircle, UserCheck, Calendar, Clock, Edit, CheckCircle2, XCircle } from "lucide-react"
import {
  ResourceDetailClient,
  FieldItem,
  type ResourceDetailField,
  type ResourceDetailSection
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { queryKeys } from "@/lib/query-keys"
import { formatDateVi } from "../utils"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { useContactRequestActions } from "../hooks/use-contact-request-actions"
import { useContactRequestFeedback } from "../hooks/use-contact-request-feedback"
import {
  CONTACT_REQUEST_LABELS,
  CONTACT_REQUEST_STATUS_COLORS,
  CONTACT_REQUEST_PRIORITY_COLORS
} from "../constants"
import { TypographyP, TypographyPMuted, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
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

  const detailFields: ResourceDetailField<ContactRequestDetailData>[] = []

  const detailSections: ResourceDetailSection<ContactRequestDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin liên hệ và nội dung yêu cầu",
      fieldsContent: (_fields, data) => {
        const requestData = data as ContactRequestDetailData

        return (
          <Flex direction="col" gap="responsive">
            {/* Contact Info */}
            <Grid cols="responsive-2" gap="responsive" fullWidth>
              <FieldItem icon={User} label="Tên người liên hệ">
                <TypographyP>
                  {requestData.name || "—"}
                </TypographyP>
              </FieldItem>

              <FieldItem icon={Mail} label="Email">
                <a
                  href={`mailto:${requestData.email}`}
                  className="text-primary hover:underline truncate block transition-colors w-full"
                >
                  {requestData.email || "—"}
                </a>
              </FieldItem>
              {requestData.phone && (
                <FieldItem icon={Phone} label="Số điện thoại">
                  <a
                    href={`tel:${requestData.phone}`}
                    className="text-primary hover:underline transition-colors"
                  >
                    {requestData.phone}
                  </a>
                </FieldItem>
              )}
            </Grid>

            {/* Subject */}
            <FieldItem icon={FileText} label="Tiêu đề">
              <TypographyP>
                {requestData.subject || "—"}
              </TypographyP>
            </FieldItem>

            {/* Content */}
            <FieldItem icon={MessageSquare} label="Nội dung">
              <Card className="border border-border/50" padding="lg">
                <TypographyP>
                  {requestData.content || "—"}
                </TypographyP>
              </Card>
            </FieldItem>
          </Flex>
        )
      },
    },
    {
      id: "status",
      title: "Trạng thái và phân công",
      description: "Trạng thái xử lý, độ ưu tiên và người được giao",
      fieldsContent: (_fields, data) => {
        const requestData = data as ContactRequestDetailData

        return (
            <Flex direction="col" gap="responsive">
            {/* Status & Priority */}
            <Grid cols="responsive-2" gap="responsive" fullWidth>
              <FieldItem icon={AlertCircle} label="Trạng thái">
                <Badge variant={CONTACT_REQUEST_STATUS_COLORS[requestData.status] || "default"} className="w-fit">
                  {(requestData.status === "NEW" && CONTACT_REQUEST_LABELS.NEW) ||
                    (requestData.status === "IN_PROGRESS" && CONTACT_REQUEST_LABELS.IN_PROGRESS) ||
                    (requestData.status === "RESOLVED" && CONTACT_REQUEST_LABELS.RESOLVED) ||
                    (requestData.status === "CLOSED" && CONTACT_REQUEST_LABELS.CLOSED) ||
                    requestData.status}
                </Badge>
              </FieldItem>

              <FieldItem icon={AlertCircle} label="Độ ưu tiên">
                <Badge variant={CONTACT_REQUEST_PRIORITY_COLORS[requestData.priority] || "default"} className="w-fit">
                  {(requestData.priority === "LOW" && CONTACT_REQUEST_LABELS.LOW) ||
                    (requestData.priority === "MEDIUM" && CONTACT_REQUEST_LABELS.MEDIUM) ||
                    (requestData.priority === "HIGH" && CONTACT_REQUEST_LABELS.HIGH) ||
                    (requestData.priority === "URGENT" && CONTACT_REQUEST_LABELS.URGENT) ||
                    requestData.priority}
                </Badge>
              </FieldItem>
            </Grid>

            {/* Read Status */}
            <FieldItem
              icon={requestData.isRead ? CheckCircle2 : XCircle}
              label="Đã đọc"
            >
              <Flex align="center" gap={3}>
                <Switch
                  checked={requestData.isRead}
                  disabled={isToggling || togglingRequests.has(contactRequestId) || !canUpdate}
                  onCheckedChange={handleToggleReadStatus}
                  aria-label={requestData.isRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                />
                <TypographyPMuted>
                  {requestData.isRead ? CONTACT_REQUEST_LABELS.READ : CONTACT_REQUEST_LABELS.UNREAD}
                </TypographyPMuted>
              </Flex>
              {!canUpdate && (
                <Flex className="mt-1.5">
                  <TypographyPSmallMuted>
                    Bạn không có quyền thay đổi trạng thái đọc
                  </TypographyPSmallMuted>
                </Flex>
              )}
            </FieldItem>

            {/* Assigned To */}
            {requestData.assignedTo && (
              <FieldItem icon={UserCheck} label="Người được giao">
                <TypographyP>
                  {requestData.assignedTo.name || requestData.assignedTo.email || "—"}
                </TypographyP>
              </FieldItem>
            )}
          </Flex>
        )
      },
    },
    {
      id: "timestamps",
      title: "Thông tin thời gian",
      description: "Ngày tạo và cập nhật lần cuối",
      fieldsContent: (_fields, data) => {
        const requestData = data as ContactRequestDetailData

        return (
          <Grid cols="responsive-2" gap="responsive" fullWidth>
            <FieldItem icon={Calendar} label="Ngày tạo">
              <TypographyP>
                {requestData.createdAt ? formatDateVi(requestData.createdAt) : "—"}
              </TypographyP>
            </FieldItem>

            <FieldItem icon={Clock} label="Cập nhật lần cuối">
              <TypographyP>
                {requestData.updatedAt ? formatDateVi(requestData.updatedAt) : "—"}
              </TypographyP>
            </FieldItem>
          </Grid>
        )
      },
    },
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <ResourceDetailClient<ContactRequestDetailData>
      data={detailData}
      fields={detailFields}
      detailSections={detailSections}
      title={detailData.subject}
      description={`Yêu cầu liên hệ từ ${detailData.name}`}
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      actions={
        !isDeleted && canUpdate ? (
          <Button
            variant="outline"
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
    />
  )
}

