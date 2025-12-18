import type { ResourceFormField, ResourceFormSection } from "@/features/admin/resources/components"
import { validateStudentCode, validateName, validateEmail } from "./utils"
import React from "react"
import { User, Mail, Hash, ToggleLeft } from "lucide-react"
import { iconSizes } from "@/lib/typography"

export interface StudentFormData {
  studentCode: string
  name?: string | null
  email?: string | null
  userId?: string | null
  isActive?: boolean
  [key: string]: unknown
}

export const getStudentFormSections = (): ResourceFormSection[] => {
  return [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về sinh viên",
    },
    {
      id: "status",
      title: "Trạng thái",
      description: "Cấu hình trạng thái hoạt động",
    },
  ]
}

export const getBaseStudentFields = (
  usersOptions?: Array<{ label: string; value: string }>,
  isSuperAdmin: boolean = false,
  canActive: boolean = false
): ResourceFormField<StudentFormData>[] => {
  const fields: ResourceFormField<StudentFormData>[] = [
    {
      name: "studentCode",
      label: "Mã sinh viên",
      type: "text",
      placeholder: "vd: HS001, STU2024",
      required: true,
      description: "Mã sinh viên (chữ cái, số, dấu gạch dưới và dấu gạch ngang)",
      validate: validateStudentCode,
      icon: React.createElement(Hash, { className: iconSizes.sm }),
      section: "basic",
    },
    {
      name: "name",
      label: "Tên sinh viên",
      type: "text",
      placeholder: "vd: Nguyễn Văn A",
      required: false,
      description: "Tên đầy đủ của sinh viên",
      validate: (value) => (!value || value === "" ? { valid: true } : validateName(value)),
      icon: React.createElement(User, { className: iconSizes.sm }),
      section: "basic",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "vd: student@example.com",
      required: false,
      description: "Email của sinh viên",
      validate: (value) => (!value || value === "" ? { valid: true } : validateEmail(value)),
      icon: React.createElement(Mail, { className: iconSizes.sm }),
      section: "basic",
    },
  ]

  if (isSuperAdmin) {
    fields.push({
      name: "userId",
      label: "Liên kết với tài khoản",
      type: "select",
      required: false,
      placeholder: "Chọn tài khoản người dùng",
      options: usersOptions || [],
      description: "Liên kết sinh viên với tài khoản người dùng (tùy chọn)",
      icon: React.createElement(User, { className: iconSizes.sm }),
      section: "basic",
    })
  }

  // Chỉ hiển thị field isActive nếu có permission STUDENTS_ACTIVE hoặc STUDENTS_MANAGE
  if (canActive) {
    fields.push({
      name: "isActive",
      label: "Trạng thái",
      description: "Bật/tắt để kích hoạt hoặc vô hiệu hóa sinh viên. Mặc định là tắt (cần xét duyệt)",
      type: "switch",
      defaultValue: false, // Mặc định false, cần xét duyệt
      icon: React.createElement(ToggleLeft, { className: iconSizes.sm }),
      section: "status",
    })
  }

  return fields
}

