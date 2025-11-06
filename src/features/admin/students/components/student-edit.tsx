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
import { prisma } from "@/lib/database"

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
  const student = await getStudentDetailById(studentId)

  if (!student) {
    return null
  }

  // Fetch users for userId select field
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 100, // Limit to 100 users
  })

  const usersOptions = users.map((user) => ({
    label: user.name ? `${user.name} (${user.email})` : user.email || user.id,
    value: user.id,
  }))

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

