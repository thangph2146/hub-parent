/**
 * Server Component: Student Detail
 * 
 * Fetches student data và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getStudentDetailById } from "../server/cache"
import { serializeStudentDetail } from "../server/helpers"
import { StudentDetailClient } from "./student-detail.client"
import type { StudentDetailData } from "./student-detail.client"
import { getSession } from "@/lib/auth/auth-server"
import { isSuperAdmin } from "@/lib/permissions"

export interface StudentDetailProps {
  studentId: string
  backUrl?: string
}

export async function StudentDetail({ studentId, backUrl = "/admin/students" }: StudentDetailProps) {
  const session = await getSession()
  const actorId = session?.user?.id
  const isSuperAdminUser = isSuperAdmin(session?.roles ?? [])
  
  const student = await getStudentDetailById(studentId, actorId, isSuperAdminUser)

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

  return (
    <StudentDetailClient
      studentId={studentId}
      student={serializeStudentDetail(student) as StudentDetailData}
      backUrl={backUrl}
    />
  )
}

