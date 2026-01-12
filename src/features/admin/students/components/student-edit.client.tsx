"use client"

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ResourceForm, type ResourceFormField } from "@/features/admin/resources/components"
import {
  useResourceFormSubmit,
  useResourceNavigation,
  useResourceDetailData,
} from "@/features/admin/resources/hooks"
import { createResourceEditOnSuccess } from "@/features/admin/resources/utils"
import { apiRoutes } from "@/constants"
import { queryKeys } from "@/constants"
import {
  getBaseStudentFields,
  getStudentFormSections,
  type StudentFormData,
} from "../form-fields"
import { StudentRow } from "../types"

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
  canActivate?: boolean
}

export const StudentEditClient = ({
  student: initialStudent,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
  studentId,
  users: usersFromServer = [],
  isSuperAdmin = false,
  canActivate = false,
}: StudentEditClientProps) => {
  const queryClient = useQueryClient()
  const isPageVariant = variant === "page"

  const { navigateBack } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminStudents.all(),
  })

  const resourceId = studentId ?? initialStudent?.id ?? ""
  const hasResourceId = Boolean(resourceId)

  const { data: studentData } = useResourceDetailData({
    initialData: initialStudent || ({} as StudentEditData),
    resourceId,
    detailQueryKey: queryKeys.adminStudents.detail,
    resourceName: "students",
    fetchOnMount: hasResourceId,
  })

  const student = useMemo<StudentEditData | null>(
    () => (studentData as StudentEditData | undefined) ?? initialStudent ?? null,
    [studentData, initialStudent],
  )

  const isDeleted = student?.deletedAt !== null && student?.deletedAt !== undefined
  const formDisabled = isDeleted && !isPageVariant
  const isActive = student?.isActive === true

  const editFields = useMemo<ResourceFormField<StudentFormData>[]>(
    () =>
      getBaseStudentFields(usersFromServer, isSuperAdmin, canActivate).map(
        (field) => {
          // Disable studentCode nếu student đã active
          const shouldDisableStudentCode = field.name === "studentCode" && isActive
          return {
            ...field,
            disabled: formDisabled || field.disabled || shouldDisableStudentCode,
            description:
              shouldDisableStudentCode
                ? "Mã sinh viên không thể thay đổi khi sinh viên đã được kích hoạt"
                : field.description,
          }
        },
      ),
    [usersFromServer, isSuperAdmin, canActivate, formDisabled, isActive],
  )
  const formSections = useMemo(() => getStudentFormSections(), [])

  const { handleSubmit } = useResourceFormSubmit({
    apiRoute: (id) => apiRoutes.students.update(id),
    method: "PUT",
    resourceId: student?.id,
    messages: {
      successTitle: "Cập nhật sinh viên thành công",
      successDescription: "sinh viên đã được cập nhật thành công.",
      errorTitle: "Lỗi cập nhật sinh viên",
    },
    navigation: {
      toDetail: isPageVariant
        ? backUrl ?? (student?.id ? `/admin/students/${student.id}` : undefined)
        : undefined,
      fallback: backUrl,
    },
    transformData: (data) => {
      const submitData = { ...data }

      if (!isSuperAdmin && student) {
        submitData.userId = student.userId
      }

      if (!canActivate) {
        delete submitData.isActive
      }

      // Không cho phép thay đổi studentCode nếu student đã active
      if (isActive && student) {
        delete submitData.studentCode
      }

      return submitData
    },
    onSuccess: createResourceEditOnSuccess({
      queryClient,
      resourceId: student?.id,
      allQueryKey: queryKeys.adminStudents.all(),
      detailQueryKey: queryKeys.adminStudents.detail,
      resourceName: "students",
      getRecordName: (data) =>
        (data.name as string | null) || (data.studentCode as string | undefined),
      onSuccess,
    }),
  })

  if (!student?.id) {
    return null
  }

  const handleSubmitWrapper = async (data: Partial<StudentFormData>) => {
    if (isDeleted) {
      return { success: false, error: "Bản ghi đã bị xóa, không thể chỉnh sửa" }
    }

    return handleSubmit(data)
  }

  return (
    <ResourceForm<StudentFormData>
      data={student}
      fields={editFields}
      sections={formSections}
      onSubmit={handleSubmitWrapper}
      title="Chỉnh sửa sinh viên"
      description={
        isDeleted
          ? "Bản ghi đã bị xóa, không thể chỉnh sửa"
          : "Cập nhật thông tin sinh viên"
      }
      submitLabel="Lưu thay đổi"
      cancelLabel="Hủy"
      backUrl={backUrl}
      backLabel={backLabel}
      onBack={() => navigateBack(backUrl || `/admin/students/${student.id}`)}
      variant={variant}
      open={open}
      onOpenChange={onOpenChange}
      showCard={!isPageVariant}
      className={isPageVariant ? "max-w-[100%]" : undefined}
      resourceName="students"
      resourceId={student.id}
      action="update"
    />
  )
}
