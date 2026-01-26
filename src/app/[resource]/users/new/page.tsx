import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { UserCreate } from "@/features/admin/users/components/user-create"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { createCreateBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * User Create Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tạo người dùng | CMS"
 */
export const metadata: Metadata = {
  title: "Tạo người dùng",
  description: "Tạo người dùng mới trong hệ thống",
}

/**
 * User Create Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 * - UserCreate component fetch roles data bên trong
 */
async function UserCreateContent({ resourceSegment }: { resourceSegment: string }) {
  return <UserCreate backUrl={`/${resourceSegment}/users`} />
}

export default async function UserCreatePage({
  params,
}: {
  params: Promise<{ resource: string }>
}) {
  const resolvedParams = await params
  const resourceSegment = resolvedParams.resource

  return (
    <>
      <AdminHeader
        breadcrumbs={createCreateBreadcrumbs({
          resourceSegment,
          listLabel: "Người dùng",
          listPath: "/admin/users",
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={8} sectionCount={2}>
          <UserCreateContent resourceSegment={resourceSegment} />
        </FormPageSuspense>
      </div>
    </>
  )
}

