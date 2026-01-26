import type { Metadata } from "next"
import { TypographyH2, TypographyPSmallMuted } from "@/components/ui/typography"
import { AdminHeader } from "@/components/layout/headers"
import { RoleDetail } from "@/features/admin/roles/components/role-detail"
import { validateRouteId } from "@/utils"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getRoleById } from "@/features/admin/roles/server/queries"
import { createDetailBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"

/**
 * Role Detail Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên role data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "{Role Name} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const role = await getRoleById(id)

  if (!role) {
    return {
      title: "Không tìm thấy",
      description: "Vai trò không tồn tại",
    }
  }

  return {
    title: role.displayName || role.name || "Chi tiết vai trò",
    description: role.description || `Chi tiết vai trò: ${role.displayName || role.name}`,
  }
}

/**
 * Role Detail Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, detail content stream khi ready
 */
async function RoleDetailContent({ roleId, resourceSegment }: { roleId: string; resourceSegment: string }) {
  return <RoleDetail roleId={roleId} backUrl={`/${resourceSegment}/roles`} />
}

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string; resource: string }>
}) {
  const { id, resource: resourceSegment } = await params
  
  // Fetch role data (non-cached) để hiển thị tên trong breadcrumb
  const role = await getRoleById(id)
  const roleName = truncateBreadcrumbLabel(role?.name || "Chi tiết")
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Vai trò")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createDetailBreadcrumbs({
            resourceSegment,
            listLabel: "Vai trò",
            listPath: `/${resourceSegment}/roles`,
            detailLabel: roleName,
            detailPath: `/${resourceSegment}/roles/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <TypographyH2 className="mb-2">ID không hợp lệ</TypographyH2>
              <TypographyPSmallMuted>
                ID vai trò không hợp lệ.
              </TypographyPSmallMuted>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        breadcrumbs={createDetailBreadcrumbs({
          resourceSegment,
          listLabel: "Vai trò",
          listPath: `/${resourceSegment}/roles`,
          detailLabel: roleName,
          detailPath: `/${resourceSegment}/roles/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={4} sectionCount={1}>
          <RoleDetailContent roleId={id} resourceSegment={resourceSegment} />
        </FormPageSuspense>
      </div>
    </>
  )
}

