import { getStudentById } from "../server/queries"
import { serializeStudentDetail } from "../server/helpers"
import { StudentEditClient } from "./student-edit.client"
import type { StudentEditClientProps } from "./student-edit.client"
import { getActiveUsersForSelect } from "@/features/admin/users/server/queries"
import { getAuthInfo } from "@/features/admin/resources/server"
import { NotFoundMessage } from "@/features/admin/resources/components"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"

export interface StudentEditProps {
  studentId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export async function StudentEdit({
  studentId,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: StudentEditProps) {
  const { actorId, isSuperAdminUser, permissions, roles } = await getAuthInfo()

  const student = await getStudentById(studentId, actorId, isSuperAdminUser)

  if (!student) {
    return <NotFoundMessage resourceName="sinh viên" />
  }

  const usersOptions = isSuperAdminUser
    ? await getActiveUsersForSelect(100) // Only fetch when needed to avoid extra load
    : []

  const canActivate = canPerformAnyAction(permissions, roles, [
    PERMISSIONS.STUDENTS_ACTIVE,
    PERMISSIONS.STUDENTS_MANAGE,
  ])

  const studentForEdit: StudentEditClientProps["student"] =
    serializeStudentDetail(student)

  return (
    <StudentEditClient
      student={studentForEdit}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      variant={variant}
      backUrl={backUrl}
      backLabel={backLabel}
      studentId={studentId}
      users={usersOptions}
      isSuperAdmin={isSuperAdminUser}
      canActivate={canActivate}
    />
  )
}
