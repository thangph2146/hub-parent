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
import { getAuthInfo } from "@/features/admin/resources/server"
import { NotFoundMessage } from "@/features/admin/resources/components"

export interface StudentDetailProps {
  studentId: string
  backUrl?: string
}

export async function StudentDetail({ studentId, backUrl = "/admin/students" }: StudentDetailProps) {
  const { actorId, isSuperAdminUser } = await getAuthInfo()
  
  const student = await getStudentDetailById(studentId, actorId, isSuperAdminUser)

  if (!student) {
    return <NotFoundMessage resourceName="học sinh" />
  }

  return (
    <StudentDetailClient
      studentId={studentId}
      student={serializeStudentDetail(student) as StudentDetailData}
      backUrl={backUrl}
    />
  )
}

