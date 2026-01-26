import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { StudentEdit } from "@/features/admin/students/components/student-edit"
import { validateRouteId } from "@/utils"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getStudentById } from "@/features/admin/students/server/queries"
import { createEditBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"
import { getAuthInfo } from "@/features/admin/resources/server"
import { TypographyH2, TypographyPMuted } from "@/components/ui/typography"

/**
 * Student Edit Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên student data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Chỉnh sửa {Student Name} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { actorId, isSuperAdminUser, permissions } = await getAuthInfo()
  const student = await getStudentById(id, actorId, isSuperAdminUser, permissions)

  if (!student) {
    return {
      title: "Không tìm thấy",
      description: "sinh viên không tồn tại",
    }
  }

  return {
    title: `Chỉnh sửa ${student.name || student.studentCode || "sinh viên"}`,
    description: `Chỉnh sửa thông tin sinh viên: ${student.name || student.studentCode}`,
  }
}

interface StudentEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * Student Edit Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 * - StudentEdit component sử dụng Promise.all để fetch student, users, và auth info song song
 */
async function StudentEditContent({ studentId, resourceSegment }: { studentId: string; resourceSegment: string }) {
  return <StudentEdit studentId={studentId} variant="page" backUrl={`/${resourceSegment}/students/${studentId}`} />
}

export default async function StudentEditPage({
  params,
}: {
  params: Promise<{ id: string; resource: string }>
}) {
  const { id, resource: resourceSegment } = await params
  
  // Fetch student data (non-cached) để hiển thị tên trong breadcrumb
  // Theo chuẩn Next.js 16: không cache admin data
  const { actorId, isSuperAdminUser, permissions } = await getAuthInfo()
  const student = await getStudentById(id, actorId, isSuperAdminUser, permissions)
  const studentName = truncateBreadcrumbLabel(student?.name || student?.studentCode || "Chi tiết")
  
  // Validate route ID
  const validatedId = validateRouteId(id, "sinh viên")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createEditBreadcrumbs({
            resourceSegment,
            listLabel: "sinh viên",
            listPath: "/admin/students",
            detailLabel: studentName,
            detailPath: `/admin/students/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <TypographyH2 className="mb-2">ID không hợp lệ</TypographyH2>
              <TypographyPMuted>
                ID sinh viên không hợp lệ.
              </TypographyPMuted>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        breadcrumbs={createEditBreadcrumbs({
          resourceSegment,
          listLabel: "sinh viên",
          listPath: "/admin/students",
          detailLabel: studentName,
          detailPath: `/admin/students/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={8} sectionCount={2}>
          <StudentEditContent studentId={validatedId} resourceSegment={resourceSegment} />
        </FormPageSuspense>
      </div>
    </>
  )
}

