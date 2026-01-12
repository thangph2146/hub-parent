import { StudentCreateClient } from "./student-create.client"
import { getActiveUsersForSelect } from "@/features/admin/users/server/queries"
import { getAuthInfo } from "@/features/admin/resources/server"
import { PERMISSIONS, canPerformAnyAction } from "@/permissions"

export interface StudentCreateProps {
  backUrl?: string
}

export async function StudentCreate({ backUrl = "/admin/students" }: StudentCreateProps) {
  const { isSuperAdminUser, permissions, roles } = await getAuthInfo()

  // Chi fetch users options neu la super admin
  const usersOptions = isSuperAdminUser ? await getActiveUsersForSelect(100) : []
  const canActivate = canPerformAnyAction(permissions, roles, [
    PERMISSIONS.STUDENTS_ACTIVE,
    PERMISSIONS.STUDENTS_MANAGE,
  ])

  return (
    <StudentCreateClient
      backUrl={backUrl}
      users={usersOptions}
      isSuperAdmin={isSuperAdminUser}
      canActivate={canActivate}
    />
  )
}
