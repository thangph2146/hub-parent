import type { Metadata } from "next"
import { AdminHeader } from "@/components/layout/headers"
import { RoleCreate } from "@/features/admin/roles/components/role-create"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { createCreateBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Role Create Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tạo vai trò | CMS"
 */
export const metadata: Metadata = {
  title: "Tạo vai trò",
  description: "Tạo vai trò mới",
}

/**
 * Role Create Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 */
async function RoleCreateContent() {
  return <RoleCreate backUrl="/admin/roles" />
}

export default async function RoleCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={createCreateBreadcrumbs({
          listLabel: "Vai trò",
          listPath: "/admin/roles",
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={6} sectionCount={2}>
          <RoleCreateContent />
        </FormPageSuspense>
      </div>
    </>
  )
}

