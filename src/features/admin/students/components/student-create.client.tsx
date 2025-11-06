/**
 * Client Component: Student Create Form
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

export interface StudentCreateClientProps {
  backUrl?: string
  users?: Array<{ label: string; value: string }>
}

export function StudentCreateClient({ backUrl = "/admin/students", users: usersFromServer = [] }: StudentCreateClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (data: Partial<StudentFormData>) => {
    try {
      const submitData: Record<string, unknown> = {
        ...data,
      }

      // Validation được xử lý bởi Zod ở server side
      const response = await apiClient.post(apiRoutes.students.create, submitData)

      if (response.status === 201) {
        toast({
          variant: "success",
          title: "Tạo học sinh thành công",
          description: "Học sinh mới đã được tạo thành công.",
        })

        if (response.data?.data?.id) {
          router.push(`/admin/students/${response.data.data.id}`)
        } else {
          router.push("/admin/students")
        }

        return { success: true }
      }

      toast({
        variant: "destructive",
        title: "Tạo học sinh thất bại",
        description: "Không thể tạo học sinh. Vui lòng thử lại.",
      })
      return { success: false, error: "Không thể tạo học sinh" }
    } catch (error: unknown) {
      const errorMessage = extractAxiosErrorMessage(error, "Đã xảy ra lỗi khi tạo học sinh")

      toast({
        variant: "destructive",
        title: "Lỗi tạo học sinh",
        description: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  const createFields = getBaseStudentFields(usersFromServer)
  const formSections = getStudentFormSections()

  return (
    <ResourceForm<StudentFormData>
      data={null}
      fields={createFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Tạo học sinh mới"
      description="Nhập thông tin để tạo học sinh mới"
      submitLabel="Tạo học sinh"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
    />
  )
}

