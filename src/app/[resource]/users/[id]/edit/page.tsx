import type { Metadata } from "next"
import { TypographyH2, TypographyPSmallMuted } from "@/components/ui/typography"
import { AdminHeader } from "@/components/layout/headers"
import { UserEdit } from "@/features/admin/users/components/user-edit"
import { validateRouteId } from "@/utils"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getUserDetailById } from "@/features/admin/users/server/queries"
import { createEditBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"

/**
 * User Edit Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên user data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Chỉnh sửa {User Name} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const user = await getUserDetailById(id)

  if (!user) {
    return {
      title: "Không tìm thấy",
      description: "Người dùng không tồn tại",
    }
  }

  return {
    title: `Chỉnh sửa ${user.name || user.email || "người dùng"}`,
    description: `Chỉnh sửa thông tin người dùng: ${user.name || user.email}`,
  }
}

/**
 * User Edit Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 * - UserEdit component sử dụng Promise.all để fetch user và roles song song
 */
async function UserEditContent({ userId, resourceSegment }: { userId: string; resourceSegment: string }) {
  return (
    <UserEdit
      userId={userId}
      variant="page"
      backUrl={`/${resourceSegment}/users/${userId}`}
      backLabel="Quay lại chi tiết"
    />
  )
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string; resource: string }>
}) {
  const { id, resource: resourceSegment } = await params
  
  // Fetch user data (non-cached) để hiển thị tên trong breadcrumb
  // Theo chuẩn Next.js 16: không cache admin data
  const user = await getUserDetailById(id)
  const userName = truncateBreadcrumbLabel(user?.name || user?.email || "Chi tiết")
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Người dùng")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createEditBreadcrumbs({
            resourceSegment,
            listLabel: "Người dùng",
            listPath: "/admin/users",
            detailLabel: userName,
            detailPath: `/admin/users/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <TypographyH2 className="mb-2">ID không hợp lệ</TypographyH2>
              <TypographyPSmallMuted>
                ID người dùng không hợp lệ.
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
        breadcrumbs={createEditBreadcrumbs({
          resourceSegment,
          listLabel: "Người dùng",
          listPath: "/admin/users",
          detailLabel: userName,
          detailPath: `/admin/users/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={8} sectionCount={2}>
          <UserEditContent userId={validatedId} resourceSegment={resourceSegment} />
        </FormPageSuspense>
      </div>
    </>
  )
}
