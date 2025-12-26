"use client"

import { TypographyP, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

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
          <Grid cols="responsive-2" fullWidth gap={6}>
            <FieldItem icon={Hash} label="Mã sinh viên">
              <TypographyP className="font-mono">{studentData.studentCode || "—"}</TypographyP>
            </FieldItem>
            <FieldItem icon={User} label="Tên sinh viên">
              <TypographyP>{studentData.name || "—"}</TypographyP>
            </FieldItem>
            {studentData.email && (
              <FieldItem icon={Mail} label="Email">
                <a
                  href={`mailto:${studentData.email}`}
                  className="text-primary hover:underline truncate block transition-colors"
                >
                  {studentData.email}
                </a>
              </FieldItem>
            )}
            {studentData.userId && studentData.userName && (
              <FieldItem icon={User} label="Tài khoản liên kết">
                <Flex direction="col" gap={1}>
                  <TypographyP>{studentData.userName}</TypographyP>
                  {studentData.userEmail && (
                    <TypographyPSmallMuted>{studentData.userEmail}</TypographyPSmallMuted>
                  )}
                </Flex>
              </FieldItem>
            )}
          </Grid>
        )
      },
    },
    
  ]

  const isDeleted = detailData.deletedAt !== null && detailData.deletedAt !== undefined

  return (
    <Flex direction="col" fullWidth gap={6}>
      <ResourceDetailClient<StudentDetailData>
        title="Thông tin sinh viên"
        description={`Thông tin chính về sinh viên ${detailData.name}`}
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
            >
              <Flex align="center" gap={2}>
                <IconSize size="sm">
                  <Edit />
                </IconSize>
                Chỉnh sửa
              </Flex>
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
    </Flex>
  )
}
