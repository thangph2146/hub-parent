import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import { validateRoleName, validateDisplayName, validateDescription } from "./utils"
import { PERMISSIONS } from "@/lib/permissions"
import React from "react"
import { Shield, FileText, ToggleLeft, AlignLeft } from "lucide-react"

export interface RoleFormData {
  name: string
  displayName: string
  description?: string | null
  permissions?: string[]
  isActive?: boolean
  [key: string]: unknown
}

const resourceLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Người dùng",
  posts: "Bài viết",
  categories: "Danh mục",
  tags: "Thẻ",
  comments: "Bình luận",
  roles: "Vai trò",
  messages: "Tin nhắn",
  notifications: "Thông báo",
  contact_requests: "Liên hệ",
  students: "sinh viên",
  settings: "Cài đặt",
}

const actionLabels: Record<string, string> = {
  view: "Xem",
  create: "Tạo",
  update: "Cập nhật",
  delete: "Xóa",
  publish: "Xuất bản",
  approve: "Duyệt",
  assign: "Gán",
  manage: "Quản lý",
}

export const getAllPermissionsOptionGroups = (): Array<{ label: string; options: Array<{ label: string; value: string }> }> => {
  const grouped: Record<string, Array<{ label: string; value: string }>> = {}
  const seenValues = new Set<string>()

  Object.entries(PERMISSIONS).forEach(([_key, value]) => {
    const permissionValue = String(value)
    if (seenValues.has(permissionValue)) return
    
    const [resource, action] = permissionValue.split(":")
    if (!grouped[resource]) grouped[resource] = []
    
    grouped[resource].push({
      label: `${actionLabels[action] || action} - ${resourceLabels[resource] || resource}`,
      value: permissionValue,
    })
    seenValues.add(permissionValue)
  })

  return Object.entries(grouped)
    .map(([resource, options]) => ({
      label: resourceLabels[resource] || resource,
      options: options.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

const getAllPermissionsOptions = (): Array<{ label: string; value: string }> => 
  getAllPermissionsOptionGroups().flatMap((group) => group.options)

export const getRoleFormSections = (): ResourceFormSection[] => [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Thông tin chính về vai trò",
  },
  {
    id: "permissions",
    title: "Quyền truy cập",
    description: "Cấu hình các quyền cho vai trò này",
  },
]

export const getBaseRoleFields = (
  permissionsOptions?: Array<{ label: string; value: string }>,
  useGroups = true
): ResourceFormField<RoleFormData>[] => {
  const permissionsOptionGroups = useGroups ? getAllPermissionsOptionGroups() : undefined
  const flatPermissionsOptions = permissionsOptions || getAllPermissionsOptions()

  return [
    {
      name: "name",
      label: "Tên vai trò",
      type: "text",
      placeholder: "vd: editor, author",
      required: true,
      description: "Tên vai trò (chỉ chữ thường, số, dấu gạch dưới và dấu gạch ngang)",
      validate: validateRoleName,
      icon: React.createElement(Shield, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "displayName",
      label: "Tên hiển thị",
      type: "text",
      placeholder: "vd: Editor, Author",
      required: true,
      validate: validateDisplayName,
      icon: React.createElement(FileText, { className: "h-4 w-4" }),
      section: "basic",
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
      placeholder: "Nhập mô tả về vai trò",
      validate: validateDescription,
      icon: React.createElement(AlignLeft, { className: "h-4 w-4" }),
      section: "basic",
      className: "col-span-full",
    },
    {
      name: "permissions",
      label: "Quyền",
      type: "multiple-select",
      required: false,
      placeholder: "Chọn quyền",
      ...(permissionsOptionGroups
        ? { optionGroups: permissionsOptionGroups }
        : { options: flatPermissionsOptions }),
      description: "Chọn các quyền cho vai trò này",
      icon: React.createElement(Shield, { className: "h-4 w-4" }),
      section: "permissions",
    },
    {
      name: "isActive",
      label: "Trạng thái",
      description: "Bật/tắt để kích hoạt hoặc vô hiệu hóa vai trò",
      type: "switch",
      defaultValue: true,
      icon: React.createElement(ToggleLeft, { className: "h-4 w-4" }),
      section: "permissions",
    },
  ]
}

