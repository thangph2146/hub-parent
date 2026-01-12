import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import React from "react"
import { User, AlignLeft, Phone, MapPin, Lock, UserCircle, Building2, Navigation, Mail, CheckCircle2, Calendar } from "lucide-react"
import { ACCOUNT_LABELS } from "./constants"

export interface AccountFormData {
  name?: string | null
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
  avatar?: string | null
  email?: string | null
  emailVerified?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export const getAccountFormSections = (): ResourceFormSection[] => {
  return [
    {
      id: "avatar",
      title: ACCOUNT_LABELS.AVATAR,
      description: "Cập nhật ảnh đại diện của bạn",
    },
    {
      id: "personal",
      title: "Thông tin cá nhân",
      description: "Thông tin cá nhân của bạn",
    },
    {
      id: "additional",
      title: "Thông tin bổ sung",
      description: "Các thông tin bổ sung",
    },
    {
      id: "address",
      title: ACCOUNT_LABELS.ADDRESS,
      description: "Thông tin địa chỉ chi tiết",
    },
    {
      id: "security",
      title: "Bảo mật",
      description: "Thay đổi mật khẩu",
    },
    {
      id: "system",
      title: "Thông tin hệ thống",
      description: "Thông tin hệ thống và xác thực",
    },
  ]
}

export const getBaseAccountFields = (): ResourceFormField<AccountFormData>[] => {
  return [
    {
      name: "avatar",
      label: ACCOUNT_LABELS.AVATAR,
      type: "avatar",
      placeholder: "https://example.com/avatar.jpg",
      description: "URL của ảnh đại diện",
      icon: React.createElement(UserCircle, { className: "h-4 w-4" }),
      section: "avatar",
      className: "col-span-full",
    },
    {
      name: "name",
      label: ACCOUNT_LABELS.NAME,
      type: "text",
      placeholder: "Nhập tên",
      required: true,
      icon: React.createElement(User, { className: "h-4 w-4" }),
      section: "personal",
    },
    {
      name: "phone",
      label: ACCOUNT_LABELS.PHONE,
      type: "text",
      placeholder: "Nhập số điện thoại",
      icon: React.createElement(Phone, { className: "h-4 w-4" }),
      section: "personal",
    },
    {
      name: "email",
      label: ACCOUNT_LABELS.EMAIL,
      type: "text",
      placeholder: "Email",
      description: "Địa chỉ email của tài khoản",
      icon: React.createElement(Mail, { className: "h-4 w-4" }),
      section: "personal",
      disabled: true,
    },
    {
      name: "bio",
      label: ACCOUNT_LABELS.BIO,
      type: "textarea",
      placeholder: "Nhập giới thiệu",
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
      section: "additional",
      className: "col-span-full",
    },
    {
      name: "addressStreet",
      label: "Số nhà, tên đường",
      type: "text",
      placeholder: "VD: 123 Đường ABC",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressWard",
      label: "Phường/Xã",
      type: "text",
      placeholder: "Nhập phường/xã",
      icon: React.createElement(Navigation, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressDistrict",
      label: "Quận/Huyện",
      type: "text",
      placeholder: "Nhập quận/huyện",
      icon: React.createElement(Building2, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressCity",
      label: "Tỉnh/Thành phố",
      type: "text",
      placeholder: "Nhập tỉnh/thành phố",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "addressPostalCode",
      label: "Mã bưu điện",
      type: "text",
      placeholder: "Nhập mã bưu điện",
      icon: React.createElement(MapPin, { className: "h-4 w-4" }),
      section: "address",
    },
    {
      name: "password",
      label: ACCOUNT_LABELS.PASSWORD,
      type: "text",
      placeholder: "Nhập mật khẩu mới",
      description: ACCOUNT_LABELS.PASSWORD_HINT,
      icon: React.createElement(Lock, { className: "h-4 w-4" }),
      section: "security",
    },
    {
      name: "emailVerified",
      label: "Trạng thái xác thực",
      type: "text",
      placeholder: "Trạng thái xác thực",
      icon: React.createElement(CheckCircle2, { className: "h-4 w-4" }),
      section: "system",
      disabled: true,
    },
    {
      name: "createdAt",
      label: "Ngày tạo",
      type: "text",
      placeholder: "Ngày tạo",
      icon: React.createElement(Calendar, { className: "h-4 w-4" }),
      section: "system",
      disabled: true,
    },
    {
      name: "updatedAt",
      label: "Cập nhật lần cuối",
      type: "text",
      placeholder: "Cập nhật lần cuối",
      icon: React.createElement(Calendar, { className: "h-4 w-4" }),
      section: "system",
      disabled: true,
    },
  ]
}

