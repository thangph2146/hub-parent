import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import { validateIpAddress, validateUserAgent } from "./utils"
import React from "react"
import { User, Globe, MapPin, ToggleLeft, Calendar } from "lucide-react"
import { IconSize } from "@/components/ui/typography"

// Helper function to create icon with IconSize wrapper
const createIcon = (Icon: React.ComponentType<{ className?: string }>) =>
  React.createElement(IconSize, { size: "sm" as const, children: React.createElement(Icon) } as React.ComponentProps<typeof IconSize>)

export interface SessionFormData {
  userId: string
  accessToken?: string
  refreshToken?: string
  userAgent?: string | null
  ipAddress?: string | null
  isActive?: boolean
  expiresAt?: string
  [key: string]: unknown
}

export const getSessionFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin chính về session",
  },
  {
    id: "security",
    title: "Bảo mật",
    description: "Thông tin bảo mật và mạng",
  },
  {
    id: "status",
    title: "Trạng thái",
    description: "Cấu hình trạng thái và thời gian",
  },
]

export const getBaseSessionFields = (
  usersOptions?: Array<{ label: string; value: string }>
): ResourceFormField<SessionFormData>[] => [
    {
      name: "userId",
      label: "Người dùng",
      type: "select",
      required: true,
      placeholder: "Chọn người dùng",
      options: usersOptions || [],
      description: "Người dùng sở hữu session này",
      icon: createIcon(User),
      section: "basic",
    },
    {
      name: "userAgent",
      label: "User Agent",
      type: "text",
      placeholder: "vd: Mozilla/5.0...",
      required: false,
      description: "Thông tin trình duyệt/thiết bị",
      validate: validateUserAgent,
      icon: createIcon(Globe),
      section: "security",
    },
    {
      name: "ipAddress",
      label: "Địa chỉ IP",
      type: "text",
      placeholder: "vd: 192.168.1.1",
      required: false,
      description: "Địa chỉ IP của client",
      validate: validateIpAddress,
      icon: createIcon(MapPin),
      section: "security",
    },
    {
      name: "expiresAt",
      label: "Thời gian hết hạn",
      type: "text",
      required: true,
      placeholder: "YYYY-MM-DDTHH:mm:ss.sssZ",
      description: "Thời gian session hết hạn (ISO 8601 format)",
      icon: createIcon(Calendar),
      section: "status",
    },
    {
      name: "isActive",
      label: "Trạng thái",
      description: "Bật/tắt để kích hoạt hoặc vô hiệu hóa session",
      type: "switch",
      defaultValue: true,
      icon: createIcon(ToggleLeft),
      section: "status",
    },
]

