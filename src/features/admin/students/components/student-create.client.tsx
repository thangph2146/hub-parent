"use client"

import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import { useResourceFormSubmit } from "@/features/admin/resources/hooks"
import { apiRoutes } from "@/lib/api/routes"
import { getBaseStudentFields, getStudentFormSections, type StudentFormData } from "../form-fields"

export interface StudentCreateClientProps {
  backUrl?: string
  users?: Array<{ label: string; value: string }>
  isSuperAdmin?: boolean
  canActivate?: boolean
}

export const StudentCreateClient = ({ 
  backUrl = "/admin/students", 
  users: usersFromServer = [],
  isSuperAdmin = false,
  canActivate = false,
}: StudentCreateClientProps) => {  
  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: apiRoutes.students.create,
    method: "POST",
    messages: {
      successTitle: "Tạo sinh viên thành công",
      successDescription: "sinh viên mới đã được tạo thành công.",
      errorTitle: "Lỗi tạo sinh viên",
    },
    navigation: {
      toDetail: (response) =>
        response.data?.data?.id ? `/admin/students/${response.data.data.id}` : backUrl,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData = { ...data }
      if (!isSuperAdmin) {
        delete submitData.userId
      }
      if (!canActivate) {
        delete submitData.isActive
      }
      return submitData
    },
  })

  const createFields: ResourceFormField<StudentFormData>[] = getBaseStudentFields(usersFromServer, isSuperAdmin, canActivate)
  const formSections = getStudentFormSections()

  return (
    <ResourceForm<StudentFormData>
      data={null}
      fields={createFields}
      sections={formSections}
      onSubmit={handleSubmit}
      title="Tạo sinh viên mới"
      description="Vui lòng nhập đầy đủ thông tin để tạo sinh viên mới."
      submitLabel="Tạo sinh viên"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel="Quay lại danh sách"
      variant="page"
      showCard={false}
      className="max-w-[100%]"
      resourceName="students"
      action="create"
    />
  )
}
