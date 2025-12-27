"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Edit } from "lucide-react"
import { ResourceForm } from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { useResourceNavigation, useResourceDetailData, useResourceDetailLogger } from "@/features/admin/resources/hooks"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { queryKeys } from "@/lib/query-keys"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { getBaseStudentFields, getStudentFormSections, type StudentFormData } from "../form-fields"
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

  const fields = getBaseStudentFields([], false, false)
  const sections = getStudentFormSections()
  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <Flex direction="col" fullWidth gap="responsive">
      <ResourceForm<StudentFormData>
        data={detailData as StudentFormData}
        fields={fields}
        sections={sections}
        title={detailData.name || detailData.studentCode || "Thông tin sinh viên"}
        description={`Thông tin chính về sinh viên ${detailData.name || detailData.studentCode || ""}`}
        backUrl={backUrl}
        onBack={() => navigateBack(backUrl)}
        readOnly={true}
        showCard={false}
        onSubmit={async () => ({ success: false, error: "Read-only mode" })}
        resourceName="students"
        resourceId={studentId}
        action="update"
      />
      {!isDeleted && canUpdate && (
        <Flex
          align="center"
          justify="end"
          gap={2}
          fullWidth
          paddingY={2}
          border="top"
          className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10"
        >
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/students/${studentId}/edit`)}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Edit />
              </IconSize>
              Chỉnh sửa
            </Flex>
          </Button>
        </Flex>
      )}
      
      {/* Student Scores Section - chỉ hiển thị khi student isActive */}
      <StudentScoresSection
        studentId={studentId}
        isActive={detailData.isActive}
        studentName={detailData.name}
      />
    </Flex>
  )
}
