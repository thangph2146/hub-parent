import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { StudentCreate } from "@/features/admin/students/components/student-create"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { createCreateBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Student Create Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tạo sinh viên | CMS"
 */
export const metadata: Metadata = {
  title: "Tạo sinh viên",
  description: "Tạo sinh viên mới",
}

/**
 * Student Create Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 */
async function StudentCreateContent() {
  return <StudentCreate />
}

export default async function StudentCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={createCreateBreadcrumbs({
          listLabel: "sinh viên",
          listPath: "/admin/students",
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={8} sectionCount={2}>
          <StudentCreateContent />
        </FormPageSuspense>
      </div>
    </>
  )
}

