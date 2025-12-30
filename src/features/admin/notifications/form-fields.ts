import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { Bell, FileText, User, Calendar, Clock, ExternalLink, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Flex } from "@/components/ui/flex"
import { TypographyP, TypographyPSmallMuted, TypographyPMuted, IconSize } from "@/components/ui/typography"
import { formatDateVi } from "@/features/admin/resources/utils"
import { cn } from "@/lib/utils"

export interface NotificationFormData {
  kind: string
  title: string
  description: string | null
  userEmail: string
  userName: string | null
  kindBadge?: { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  isRead?: boolean
  readAt?: string | null
  actionUrl?: string | null
  createdAt?: string | null
  expiresAt?: string | null
  [key: string]: unknown
}

export const getNotificationFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin chính của thông báo",
  },
  {
    id: "status",
    title: "Trạng thái",
    description: "Trạng thái và thông tin bổ sung",
  },
  {
    id: "metadata",
    title: "Thông tin hệ thống",
    description: "Thông tin hệ thống và metadata",
  },
]

export const getBaseNotificationFields = (): ResourceFormField<NotificationFormData>[] => [
  {
    name: "kind",
    label: "Loại thông báo",
    type: "text",
    placeholder: "Loại thông báo",
    icon: React.createElement(Bell, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "title",
    label: "Tiêu đề",
    type: "text",
    placeholder: "Tiêu đề thông báo",
    required: true,
    icon: React.createElement(FileText, { className: "h-4 w-4" }),
    section: "basic",
  },
  {
    name: "description",
    label: "Mô tả",
    type: "textarea",
    placeholder: "Mô tả thông báo",
    icon: React.createElement(FileText, { className: "h-4 w-4" }),
    section: "basic",
    className: "col-span-full",
  },
  {
    name: "userEmail",
    label: "Người dùng",
    type: "email",
    placeholder: "email@example.com",
    icon: React.createElement(User, { className: "h-4 w-4" }),
    section: "basic",
  },
]

export const getNotificationDetailFields = <T extends NotificationFormData>(
  options: {
    kindBadge?: { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    isRead?: boolean
    readAt?: string | null
    actionUrl?: string | null
    createdAt?: string | null
    expiresAt?: string | null
    isNotificationOwner?: boolean
    isToggling?: boolean
    onToggleRead?: (checked: boolean) => void
  }
): ResourceFormField<T>[] => {
  const { kindBadge, isRead, readAt, actionUrl, createdAt, expiresAt, isNotificationOwner, isToggling, onToggleRead } = options

  return [
    // Kind Badge
    {
      name: "kindBadge" as keyof T,
      label: "Loại thông báo",
      type: "text" as const,
      section: "status",
      icon: React.createElement(Bell, { className: "h-4 w-4" }),
      render: () => {
        if (!kindBadge) return null
        return React.createElement(Badge, { variant: kindBadge.variant, className: "w-fit" }, kindBadge.label)
      },
    },
    // Read Status with Switch
    {
      name: "isRead" as keyof T,
      label: "Trạng thái đọc",
      type: "switch" as const,
      section: "status",
      render: (field, value) => {
        const checked = typeof value === "boolean" ? value : isRead ?? false
        return React.createElement(
          Flex,
          { direction: "col", gap: 1.5 },
          React.createElement(
            Flex,
            { align: "center", gap: 3 },
            React.createElement(Switch, {
              checked,
              disabled: isToggling || !isNotificationOwner,
              onCheckedChange: onToggleRead,
              "aria-label": checked ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc",
            }),
            React.createElement(TypographyP, null, checked ? "Đã đọc" : "Chưa đọc")
          ),
          !isNotificationOwner &&
            React.createElement(
              TypographyPSmallMuted,
              null,
              "Chỉ có thể thay đổi trạng thái thông báo của chính mình"
            )
        )
      },
    },
    // Read At Date
    ...(readAt
      ? [
          {
            name: "readAt" as keyof T,
            label: "Ngày đọc",
            type: "text" as const,
            section: "status",
            icon: React.createElement(Clock, { className: "h-4 w-4" }),
            render: () =>
              React.createElement(
                Flex,
                { align: "center", gap: 2 },
                React.createElement(
                  IconSize,
                  { size: "xs", className: "text-muted-foreground shrink-0" },
                  React.createElement(Clock)
                ),
                React.createElement(
                  "time",
                  {
                    dateTime: readAt,
                    title: new Date(readAt).toLocaleString("vi-VN", {
                      dateStyle: "full",
                      timeStyle: "long",
                    }),
                  },
                  React.createElement(TypographyPSmallMuted, null, formatDateVi(readAt))
                )
              ),
          } as ResourceFormField<T>,
        ]
      : []),
    // Action URL
    ...(actionUrl
      ? [
          {
            name: "actionUrl" as keyof T,
            label: "URL hành động",
            type: "text" as const,
            section: "metadata",
            icon: React.createElement(ExternalLink, { className: "h-4 w-4" }),
            render: () =>
              React.createElement(
                "a",
                {
                  href: actionUrl,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "group inline-flex items-center gap-2 text-primary hover:text-primary/80 hover:underline transition-colors w-full min-w-0",
                  title: actionUrl,
                },
                React.createElement(TypographyP, { className: "truncate flex-1 min-w-0" }, actionUrl),
                React.createElement(
                  IconSize,
                  { size: "xs", className: "shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" },
                  React.createElement(ExternalLink)
                )
              ),
          } as ResourceFormField<T>,
        ]
      : []),
    // Created At
    {
      name: "createdAt" as keyof T,
      label: "Ngày tạo",
      type: "text" as const,
      section: "metadata",
      icon: React.createElement(Calendar, { className: "h-4 w-4" }),
      render: () => {
        if (!createdAt) return React.createElement(TypographyPMuted, null, "—")
        return React.createElement(
          Flex,
          { align: "center", gap: 2 },
          React.createElement(
            IconSize,
            { size: "xs", className: "text-muted-foreground shrink-0" },
            React.createElement(Calendar)
          ),
          React.createElement(
            "time",
            {
              dateTime: createdAt,
              title: new Date(createdAt).toLocaleString("vi-VN", {
                dateStyle: "full",
                timeStyle: "long",
              }),
            },
            React.createElement(TypographyPSmallMuted, null, formatDateVi(createdAt))
          )
        )
      },
    },
    // Expires At
    ...(expiresAt
      ? [
          {
            name: "expiresAt" as keyof T,
            label: "Ngày hết hạn",
            type: "text" as const,
            section: "metadata",
            icon: React.createElement(Calendar, { className: "h-4 w-4" }),
            render: () => {
              const isExpired = new Date(expiresAt) < new Date()
              return React.createElement(
                Flex,
                { direction: "col", gap: 2 },
                React.createElement(
                  Flex,
                  { align: "center", gap: 2 },
                  React.createElement(
                    IconSize,
                    { size: "xs", className: "text-muted-foreground shrink-0" },
                    React.createElement(Calendar)
                  ),
                  React.createElement(
                    "time",
                    {
                      dateTime: expiresAt,
                      className: cn("", isExpired ? "text-destructive" : "text-foreground"),
                      title: new Date(expiresAt).toLocaleString("vi-VN", {
                        dateStyle: "full",
                        timeStyle: "long",
                      }),
                    },
                    formatDateVi(expiresAt)
                  )
                ),
                isExpired &&
                  React.createElement(
                    Badge,
                    { variant: "destructive", className: "w-fit" },
                    React.createElement(
                      Flex,
                      { align: "center", gap: 1 },
                      React.createElement(IconSize, { size: "xs" }, React.createElement(AlertCircle)),
                      React.createElement("span", null, "Đã hết hạn")
                    )
                  )
              )
            },
          } as ResourceFormField<T>,
        ]
      : []),
  ]
}
