/**
 * Client Component: Student Edit Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { ResourceForm } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getBaseStudentFields, getStudentFormSections, type StudentFormData } from "../form-fields"
import type { StudentRow } from "../types"

interface StudentEditData extends StudentRow {
  userId: string | null
  [key: string]: unknown
}

export interface StudentEditClientProps {
  student: StudentEditData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
  studentId?: string
  users?: Array<{ label: string; value: string }>
  isSuperAdmin?: boolean
}

export function StudentEditClient({
  student,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  studentId: _studentId,
  users: usersFromServer = [],
  isSuperAdmin = false,
}: StudentEditClientProps) {
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.students.update(id),
    method: "PUT",
    resourceId: student?.id,
    messages: {
      successTitle: "Cập nhật học sinh thành công",
      successDescription: "Học sinh đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật học sinh",
    },
    navigation: {
      toDetail: variant === "page" && backUrl
        ? backUrl
        : variant === "page" && student?.id
          ? `/admin/students/${student.id}`
          : undefined,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData = { ...data }
      // Nếu không phải super admin, không cho phép thay đổi userId
      if (!isSuperAdmin && student) {
        submitData.userId = student.userId
      }
      return submitData
    },
    onSuccess: async () => {
      if (onSuccess) {
        onSuccess()
      }
    },
  })

  if (!student?.id) {
    return null
  }

  const editFields = getBaseStudentFields(usersFromServer, isSuperAdmin)
  const formSections = getStudentFormSections()

  return (
    <ResourceForm<StudentFormData>
      data={student}
      fields={editFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Chỉnh sửa học sinh"
      description="Cập nhật thông tin học sinh"
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      showCard={variant === "page" ? false : true}
      className={variant === "page" ? "max-w-[100%]" : undefined}
    />
  )
}

