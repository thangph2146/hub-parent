/**
 * Server Component: Student Edit
 * 
 * Fetches student data, sau đó pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getStudentDetailById } from "../server/cache"
import { serializeStudentDetail } from "../server/helpers"
import { StudentEditClient } from "./student-edit.client"
import type { StudentEditClientProps } from "./student-edit.client"
import { getActiveUsersForSelectCached } from "@/features/admin/users/server/cache"
import { getSession } from "@/lib/auth/auth-server"
import { isSuperAdmin } from "@/lib/permissions"

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
  const session = await getSession()
  const actorId = session?.user?.id
  const isSuperAdminUser = isSuperAdmin(session?.roles ?? [])

  const [student, usersOptions] = await Promise.all([
    getStudentDetailById(studentId, actorId, isSuperAdminUser),
    // Chỉ fetch users options nếu là super admin
    isSuperAdminUser ? getActiveUsersForSelectCached(100) : Promise.resolve([]),
  ])

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6 lg:p-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Không tìm thấy học sinh</h2>
          <p className="text-muted-foreground">
            Học sinh không tồn tại hoặc bạn không có quyền truy cập.
          </p>
        </div>
      </div>
    )
  }

  const studentForEdit: StudentEditClientProps["student"] = {
    ...serializeStudentDetail(student),
  }

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
    />
  )
}

