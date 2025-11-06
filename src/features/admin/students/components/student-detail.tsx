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

export interface StudentDetailProps {
  studentId: string
  backUrl?: string
}

export async function StudentDetail({ studentId, backUrl = "/admin/students" }: StudentDetailProps) {
  const student = await getStudentDetailById(studentId)

  if (!student) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-6 lg:p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy học sinh</p>
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

