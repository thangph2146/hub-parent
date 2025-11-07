/**
 * Client Component: Student Edit Form
 * 
 * Handles form interactions, validation, và API calls
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { useRouter } from "next/navigation"
import { ResourceForm } from "@/features/admin/resources/components"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { useToast } from "@/hooks/use-toast"
import { extractAxiosErrorMessage } from "@/lib/utils/api-utils"
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
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (data: Partial<StudentEditData>) => {
    if (!student?.id) {
      return { success: false, error: "Không tìm thấy học sinh" }
    }

    try {
      const submitData: Record<string, unknown> = {
        ...data,
      }

      // Nếu không phải super admin, không cho phép thay đổi userId
      if (!isSuperAdmin) {
        // Giữ nguyên userId hiện tại của student
        submitData.userId = student.userId
      }

      // Validation được xử lý bởi Zod ở server side
      const response = await apiClient.put(apiRoutes.students.update(student.id), submitData)

      if (response.status === 200) {
        toast({
          variant: "success",
          title: "Cập nhật học sinh thành công",
          description: "Học sinh đã được cập nhật thành công.",
        })

        if (onSuccess) {
          onSuccess()
        } else if (variant === "page" && backUrl) {
          router.push(backUrl)
        } else if (variant === "page") {
          router.push(`/admin/students/${student.id}`)
        }

        return { success: true }
      }

      toast({
        variant: "destructive",
        title: "Cập nhật học sinh thất bại",
        description: "Không thể cập nhật học sinh. Vui lòng thử lại.",
      })
      return { success: false, error: "Không thể cập nhật học sinh" }
    } catch (error: unknown) {
      const errorMessage = extractAxiosErrorMessage(error, "Đã xảy ra lỗi khi cập nhật học sinh")

      toast({
        variant: "destructive",
        title: "Lỗi cập nhật học sinh",
        description: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  const editFields = getBaseStudentFields(usersFromServer, isSuperAdmin)
  const formSections = getStudentFormSections()

  if (!student) {
    return null
  }

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

