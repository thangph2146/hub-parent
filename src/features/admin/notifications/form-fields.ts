import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { Bell, FileText, User } from "lucide-react"

export interface NotificationFormData {
  kind: string
  title: string
  description: string | null
  userEmail: string
  userName: string | null
  [key: string]: unknown
}

export const getNotificationFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin chính của thông báo",
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

