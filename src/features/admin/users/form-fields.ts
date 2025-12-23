import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import { validateEmail, validateName, validatePassword } from "./utils"
import type { Role } from "./utils"
import React from "react"
import { Mail, User, Shield, AlignLeft, Phone, MapPin, ToggleLeft, Lock } from "lucide-react"
import { IconSize } from "@/components/ui/typography"

// Helper function to create icon with IconSize wrapper
const createIcon = (Icon: React.ComponentType<{ className?: string }>) =>
  React.createElement(IconSize, { size: "sm" as const, children: React.createElement(Icon) } as React.ComponentProps<typeof IconSize>)

export interface UserFormData {
  email: string
  name?: string | null
  roleIds?: string[] | string
  isActive?: boolean
  bio?: string | null
  phone?: string | null
  address?: string | null
  password?: string
  [key: string]: unknown
}

export const getUserFormSections = (): ResourceFormSection[] => [
  {
    id: "login",
    title: "Thông tin đăng nhập",
    description: "Thông tin dùng để đăng nhập vào hệ thống",
  },
  {
    id: "personal",
    title: "Thông tin cá nhân",
    description: "Thông tin cá nhân của người dùng",
  },
  {
    id: "additional",
    title: "Thông tin bổ sung",
    description: "Các thông tin bổ sung về người dùng",
  },
  {
    id: "access",
    title: "Vai trò & Trạng thái",
    description: "Cấu hình quyền truy cập và trạng thái hoạt động",
  },
]

export const getBaseUserFields = (roles: Role[], roleDefaultValue = ""): ResourceFormField<UserFormData>[] => {
  return [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "email@example.com",
      required: true,
      validate: validateEmail,
      icon: createIcon(Mail),
      section: "login",
    },
    {
      name: "name",
      label: "Tên",
      type: "text",
      placeholder: "Nhập tên",
      validate: validateName,
      icon: createIcon(User),
      section: "personal",
    },
    {
      name: "phone",
      label: "Số điện thoại",
      type: "text",
      placeholder: "Nhập số điện thoại",
      icon: createIcon(Phone),
      section: "personal",
    },
    {
      name: "bio",
      label: "Giới thiệu",
      type: "textarea",
      placeholder: "Nhập giới thiệu về người dùng",
      icon: createIcon(AlignLeft),
      section: "additional",
    },
    {
      name: "address",
      label: "Địa chỉ",
      type: "textarea",
      placeholder: "Nhập địa chỉ",
      icon: createIcon(MapPin),
      section: "additional",
    },
    {
      name: "roleIds",
      label: "Vai trò",
      type: "select",
      required: false,
      placeholder: "Chọn vai trò",
      options: roles.map((role) => ({
        label: role.displayName || role.name,
        value: role.id,
      })),
      defaultValue: roleDefaultValue,
      icon: createIcon(Shield),
      section: "access",
    },
    {
      name: "isActive",
      label: "Trạng thái",
      description: "Bật/tắt để kích hoạt hoặc vô hiệu hóa người dùng",
      type: "switch",
      defaultValue: true,
      icon: createIcon(ToggleLeft),
      section: "access",
    }
  ]
}

export const getPasswordField = (): ResourceFormField<UserFormData> => ({
  name: "password",
  label: "Mật khẩu",
  type: "password",
  placeholder: "Nhập mật khẩu",
  required: true,
  description: "Mật khẩu phải có ít nhất 6 ký tự",
  validate: (value) => validatePassword(value, false),
  icon: createIcon(Lock),
  section: "login",
})

export const getPasswordEditField = (): ResourceFormField<UserFormData> => ({
  name: "password",
  label: "Mật khẩu mới",
  type: "password",
  placeholder: "Để trống nếu không muốn thay đổi",
  description: "Chỉ nhập nếu muốn thay đổi mật khẩu. Để trống để giữ nguyên mật khẩu hiện tại.",
  required: false,
  validate: (value) => validatePassword(value, true),
  icon: createIcon(Lock),
  section: "login",
})

