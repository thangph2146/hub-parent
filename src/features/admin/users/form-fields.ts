/**
 * Shared form field definitions cho user forms
 */

import type { ResourceFormField } from "@/features/admin/resources/components"
import { validateEmail, validateName, validatePassword } from "./utils"
import type { Role } from "./utils"
import React from "react"
import { Mail, User, Shield, AlignLeft, Phone, MapPin, ToggleLeft, Lock } from "lucide-react"

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

/**
 * Base fields cho user form (email, name, roles, isActive, bio, phone, address)
 */
export function getBaseUserFields(roles: Role[], roleDefaultValue = ""): ResourceFormField<UserFormData>[] {
  return [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "email@example.com",
      required: true,
      validate: validateEmail,
      icon: React.createElement(Mail, { className: "h-4 w-4" }),
    },
    {
      name: "name",
      label: "Tên",
      type: "text",
      placeholder: "Nhập tên",
      validate: validateName,
      icon: React.createElement(User, { className: "h-4 w-4" }),
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
    },
    {
      name: "bio",
      label: "Giới thiệu",
      type: "textarea",
      placeholder: "Nhập giới thiệu về người dùng",
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
    },
    {
      name: "phone",
      label: "Số điện thoại",
      type: "text",
      placeholder: "Nhập số điện thoại",
      icon: React.createElement(Phone, { className: "h-4 w-4" }),
    },
    {
      name: "address",
      label: "Địa chỉ",
      type: "textarea",
      placeholder: "Nhập địa chỉ",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
    },
    {
      name: "isActive",
      label: "Trạng thái",
      description: "Bật/tắt để kích hoạt hoặc vô hiệu hóa người dùng",
      type: "switch",
      defaultValue: true,
      icon: React.createElement(ToggleLeft, { className: "h-4 w-4" }),
    }
  ]
}

/**
 * Password field cho create form
 */
export function getPasswordField(): ResourceFormField<UserFormData> {
  return {
    name: "password",
    label: "Mật khẩu",
    type: "password",
    placeholder: "Nhập mật khẩu",
    required: true,
    description: "Mật khẩu phải có ít nhất 6 ký tự",
    validate: (value) => validatePassword(value, false),
    icon: React.createElement(Lock, { className: "h-4 w-4" }),
  }
}

/**
 * Password field cho edit form (optional, only for super admin)
 */
export function getPasswordEditField(): ResourceFormField<UserFormData> {
  return {
    name: "password",
    label: "Mật khẩu mới",
    type: "password",
    placeholder: "Để trống nếu không muốn thay đổi",
    description: "Chỉ nhập nếu muốn thay đổi mật khẩu. Để trống để giữ nguyên mật khẩu hiện tại.",
    required: false,
    validate: (value) => validatePassword(value, true),
    icon: React.createElement(Lock, { className: "h-4 w-4" }),
  }
}

