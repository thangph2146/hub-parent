import { getStudentById } from "../server/queries"
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
  
  const student = await getStudentById(studentId, actorId, isSuperAdminUser)

  if (!student) {
    return <NotFoundMessage resourceName="sinh viên" />
  }

  return (
    <StudentDetailClient
      studentId={studentId}
      student={serializeStudentDetail(student) as StudentDetailData}
      backUrl={backUrl}
    />
  )
}

