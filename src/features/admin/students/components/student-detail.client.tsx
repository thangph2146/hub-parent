"use client"

import { typography } from "@/lib/typography"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { User, Mail, Hash, Edit } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { queryKeys } from "@/lib/query-keys"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { StudentScoresSection } from "./student-scores-section"

export interface StudentDetailData {
  id: string
  userId: string | null
  name: string | null
  email: string | null
  studentCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  userName: string | null
  userEmail: string | null
  [key: string]: unknown
}

export interface StudentDetailClientProps {
  studentId: string
  student: StudentDetailData
  backUrl?: string
}

export const StudentDetailClient = ({ studentId, student, backUrl = "/admin/students" }: StudentDetailClientProps) => {
  const queryClient = useQueryClient()
  const router = useResourceRouter()
  const { navigateBack } = useResourceNavigation({
    queryClient,
    invalidateQueryKey: queryKeys.adminStudents.all(),
  })
  const { hasAnyPermission } = usePermissions()
  
  // Check permission for edit
  const canUpdate = hasAnyPermission([PERMISSIONS.STUDENTS_UPDATE, PERMISSIONS.STUDENTS_MANAGE])

  const { data: detailData, isFetched, isFromApi, fetchedData } = useResourceDetailData({
    initialData: student,
    resourceId: studentId,
    detailQueryKey: queryKeys.adminStudents.detail,
    resourceName: "students",
    fetchOnMount: true,
  })

  useResourceDetailLogger({
    resourceName: "students",
    resourceId: studentId,
    data: detailData,
    isFetched,
    isFromApi,
    fetchedData,
  })

  const detailFields: ResourceDetailField<StudentDetailData>[] = []

  const detailSections: ResourceDetailSection<StudentDetailData>[] = [
    {
      id: "basic",
      title: "Thông tin cơ bản",
      description: "Thông tin chính về sinh viên",
      fieldsContent: (_fields, data) => {
        const studentData = (data || detailData) as StudentDetailData
        
        return (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Student Code & Name */}
            <FieldItem icon={Hash} label="Mã sinh viên">
              <div className={`${typography.body.medium} font-medium font-mono`}>
                {studentData.studentCode || "—"}
              </div>
            </FieldItem>

            <FieldItem icon={User} label="Tên sinh viên">
              <div className={`${typography.body.medium} font-medium`}>
                {studentData.name || "—"}
              </div>
            </FieldItem>

            {/* Email */}
            {studentData.email && (
              <FieldItem icon={Mail} label="Email">
                <a
                  href={`mailto:${studentData.email}`}
                  className={`${typography.body.medium} font-medium text-primary hover:underline truncate block transition-colors`}
                >
                  {studentData.email}
                </a>
              </FieldItem>
            )}

            {/* Linked Account */}
            {studentData.userId && studentData.userName && (
              <FieldItem icon={User} label="Tài khoản liên kết">
                <div className="space-y-0.5">
                  <div className={`${typography.body.medium} font-medium`}>
                    {studentData.userName}
                  </div>
                  {studentData.userEmail && (
                    <div className={typography.body.muted.small}>
                      {studentData.userEmail}
                    </div>
                  )}
                </div>
              </FieldItem>
            )}
          </div>
        )
      },
    },
    
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <div className="space-y-6">
      <ResourceDetailClient<StudentDetailData>
        data={detailData}
        fields={detailFields}
        detailSections={detailSections}
        backUrl={backUrl}
        onBack={() => navigateBack(backUrl)}
        actions={
          !isDeleted && canUpdate ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/students/${studentId}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Chỉnh sửa
            </Button>
          ) : null
        }
      />
      
      {/* Student Scores Section - chỉ hiển thị khi student isActive */}
      <StudentScoresSection
        studentId={studentId}
        isActive={detailData.isActive}
        studentName={detailData.name}
      />
    </div>
  )
}
