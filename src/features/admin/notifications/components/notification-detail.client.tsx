"use client"

import { 
  Bell, 
  User, 
  Calendar, 
  Clock, 
  ExternalLink,
  FileText,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle as XCircleIcon
} from "lucide-react"
import { ResourceDetailPage, type ResourceDetailField } from "@/features/admin/resources/components"
import { Badge } from "@/components/ui/badge"
import { formatDateVi } from "@/features/admin/users/utils"

const NOTIFICATION_KINDS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  MESSAGE: { label: "Tin nhắn", variant: "default" },
  SYSTEM: { label: "Hệ thống", variant: "secondary" },
  ANNOUNCEMENT: { label: "Thông báo", variant: "outline" },
  ALERT: { label: "Cảnh báo", variant: "destructive" },
  WARNING: { label: "Cảnh báo", variant: "destructive" },
  SUCCESS: { label: "Thành công", variant: "default" },
  INFO: { label: "Thông tin", variant: "secondary" },
}

export interface NotificationDetailData extends Record<string, unknown> {
  id: string
  userId: string
  user: {
    id: string
    email: string
    name: string | null
  }
  kind: string
  title: string
  description: string | null
  isRead: boolean
  actionUrl: string | null
  metadata: unknown
  expiresAt: string | null
  createdAt: string
  readAt: string | null
}

export interface NotificationDetailClientProps {
  notification: NotificationDetailData
  backUrl?: string
}

export function NotificationDetailClient({ notification, backUrl = "/admin/notifications" }: NotificationDetailClientProps) {

  const kindConfig = NOTIFICATION_KINDS[notification.kind] || { label: notification.kind, variant: "secondary" as const }

  const detailFields: ResourceDetailField<NotificationDetailData>[] = [
    {
      name: "kind",
      label: "Loại thông báo",
      type: "custom",
      render: () => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <Badge variant={kindConfig.variant} className="text-xs">{kindConfig.label}</Badge>
        </div>
      ),
    },
    {
      name: "title",
      label: "Tiêu đề",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-1/10">
            <FileText className="h-4 w-4 text-chart-1" />
          </div>
          <div className="text-sm">{String(value || "—")}</div>
        </div>
      ),
    },
    {
      name: "description",
      label: "Mô tả",
      type: "custom",
      render: (value) => (
        <div>
          {value ? (
            <p className="text-sm leading-normal">{String(value)}</p>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      name: "user",
      label: "Người dùng",
      type: "custom",
      render: (value) => {
        const user = value as NotificationDetailData["user"]
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-2/10">
              <User className="h-4 w-4 text-chart-2" />
            </div>
            <div>
              <div className="text-sm">{user?.email || "—"}</div>
              {user?.name && <div className="text-xs text-muted-foreground">{user.name}</div>}
            </div>
          </div>
        )
      },
    },
    {
      name: "isRead",
      label: "Trạng thái đọc",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-3/10">
            {value ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircleIcon className="h-4 w-4 text-orange-500" />
            )}
          </div>
          <Badge variant={value ? "default" : "secondary"} className="text-xs">
            {value ? "Đã đọc" : "Chưa đọc"}
          </Badge>
        </div>
      ),
    },
    {
      name: "actionUrl",
      label: "URL hành động",
      type: "custom",
      render: (value) => {
        const url = value as string | null
        if (!url) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )
      },
    },
    {
      name: "createdAt",
      label: "Ngày tạo",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-4/10">
            <Calendar className="h-4 w-4 text-chart-4" />
          </div>
          <div className="text-sm">
            {value ? formatDateVi(value as string) : "—"}
          </div>
        </div>
      ),
    },
    {
      name: "readAt",
      label: "Ngày đọc",
      type: "custom",
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-5/10">
            <Clock className="h-4 w-4 text-chart-5" />
          </div>
          <div className="text-sm">
            {value ? formatDateVi(value as string) : <span className="text-muted-foreground">Chưa đọc</span>}
          </div>
        </div>
      ),
    },
    {
      name: "expiresAt",
      label: "Ngày hết hạn",
      type: "custom",
      render: (value) => {
        const expiresAt = value as string | null
        if (!expiresAt) return <span className="text-muted-foreground text-sm">Không có hạn</span>
        const isExpired = new Date(expiresAt) < new Date()
        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-1/10">
              {isExpired ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Info className="h-4 w-4 text-chart-1" />
              )}
            </div>
            <div>
              <div className="text-sm">{formatDateVi(expiresAt)}</div>
              {isExpired && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  Đã hết hạn
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
  ]

  // Split fields into sections
  const mainFields = detailFields.filter(f => 
    ["kind", "title", "description", "user"].includes(String(f.name))
  )
  const statusFields = detailFields.filter(f => 
    ["isRead", "readAt"].includes(String(f.name))
  )
  const metadataFields = detailFields.filter(f => 
    ["createdAt", "expiresAt", "actionUrl"].includes(String(f.name))
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Detail Sections */}
      <ResourceDetailPage
        data={notification}
        fields={{
          title: "Thông tin cơ bản",
          description: "Thông tin chính của thông báo",
          fields: mainFields,
        }}
        sections={[
          {
            title: "Trạng thái",
            description: "Thông tin trạng thái của thông báo",
            fields: statusFields,
          },
          {
            title: "Thông tin bổ sung",
            description: "Thông tin chi tiết về thông báo",
            fields: metadataFields,
          },
        ]}
        backUrl={backUrl}
        backLabel="Quay lại danh sách"
      />
    </div>
  )
}

