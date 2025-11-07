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
  const [student, usersOptions] = await Promise.all([
    getStudentDetailById(studentId),
    getActiveUsersForSelectCached(100),
  ])

  if (!student) {
    return null
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
    />
  )
}

