import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import { validateEmail, validateName, validatePassword } from "./utils"
import type { Role } from "./utils"
import React from "react"
import { Mail, User, Shield, AlignLeft, Phone, MapPin, ToggleLeft, Lock, Building2, Navigation } from "lucide-react"

export interface UserFormData {
  email: string
  name?: string | null
  roleIds?: string[] | string
  isActive?: boolean
  bio?: string | null
  phone?: string | null
  address?: string | null
  // Structured address fields (for form input)
  addressStreet?: string | null
  addressWard?: string | null
  addressDistrict?: string | null
  addressCity?: string | null
  addressPostalCode?: string | null
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
    id: "address",
    title: "Địa chỉ",
    description: "Thông tin địa chỉ chi tiết",
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
      icon: React.createElement(Mail, { className: "h-4 w-4" }),
      section: "login",
    },
    {
      name: "name",
      label: "Tên",
      type: "text",
      placeholder: "Nhập tên",
      validate: validateName,
      icon: React.createElement(User, { className: "h-4 w-4" }),
      section: "personal",
    },
    {
      name: "phone",
      label: "Số điện thoại",
      type: "text",
      placeholder: "Nhập số điện thoại",
      icon: React.createElement(Phone, { className: "h-4 w-4" }),
      section: "personal",
    },
    {
      name: "bio",
      label: "Giới thiệu",
      type: "textarea",
      placeholder: "Nhập giới thiệu về người dùng",
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
      section: "additional",
    },
    {
      name: "addressStreet",
      label: "Số nhà, Đường",
      type: "text",
      placeholder: "Ví dụ: 125 Đường Đỗ Uyên",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressWard",
      label: "Phường/Xã",
      type: "text",
      placeholder: "Ví dụ: Phường 2",
      icon: React.createElement(Building2, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressDistrict",
      label: "Quận/Huyện",
      type: "text",
      placeholder: "Ví dụ: Quận Hoàn Kiếm",
      icon: React.createElement(Navigation, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressCity",
      label: "Thành phố/Tỉnh",
      type: "text",
      placeholder: "Ví dụ: Hà Nội",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressPostalCode",
      label: "Mã bưu điện",
      type: "text",
      placeholder: "Ví dụ: 71593 (tùy chọn)",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
      section: "address",
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
      icon: React.createElement(Shield, { className: "h-4 w-4" }),
      section: "access",
    },
    {
      name: "isActive",
      label: "Trạng thái",
      description: "Bật/tắt để kích hoạt hoặc vô hiệu hóa người dùng",
      type: "switch",
      defaultValue: true,
      icon: React.createElement(ToggleLeft, { className: "h-4 w-4" }),
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
  icon: React.createElement(Lock, { className: "h-4 w-4" }),
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
  icon: React.createElement(Lock, { className: "h-4 w-4" }),
  section: "login",
})

