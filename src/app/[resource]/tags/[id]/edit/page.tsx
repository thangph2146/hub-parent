import type { Metadata } from "next"
import { TypographyH2, TypographyPSmallMuted } from "@/components/ui/typography"
import { AdminHeader } from "@/components/layouts/headers"
import { TagEdit } from "@/features/admin/tags/components/tag-edit"
import { validateRouteId } from "@/lib/utils"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getTagById } from "@/features/admin/tags/server/queries"
import { createEditBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"

/**
 * Tag Edit Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên tag data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Chỉnh sửa {Tag Name} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const tag = await getTagById(id)

  if (!tag) {
    return {
      title: "Không tìm thấy",
      description: "Thẻ tag không tồn tại",
    }
  }

  return {
    title: `Chỉnh sửa ${tag.name || "thẻ tag"}`,
    description: `Chỉnh sửa thông tin thẻ tag: ${tag.name || ""}`,
  }
}

interface TagEditPageProps {
  params: Promise<{ id: string }>
}

/**
 * Tag Edit Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 */
async function TagEditContent({ tagId }: { tagId: string }) {
  return <TagEdit tagId={tagId} variant="page" backUrl={`/admin/tags/${tagId}`} />
}

export default async function TagEditPage({ params }: TagEditPageProps) {
  const { id } = await params
  
  // Fetch tag data (non-cached) để hiển thị tên trong breadcrumb
  // Theo chuẩn Next.js 16: không cache admin data
  const tag = await getTagById(id)
  const tagName = truncateBreadcrumbLabel(tag?.name || "Chi tiết")
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Thẻ tag")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createEditBreadcrumbs({
            listLabel: "Thẻ tag",
            listPath: "/admin/tags",
            detailLabel: tagName,
            detailPath: `/admin/tags/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <TypographyH2 className="mb-2">ID không hợp lệ</TypographyH2>
              <TypographyPSmallMuted>
                ID thẻ tag không hợp lệ.
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
          listLabel: "Thẻ tag",
          listPath: "/admin/tags",
          detailLabel: tagName,
          detailPath: `/admin/tags/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={6} sectionCount={1}>
          <TagEditContent tagId={validatedId} />
        </FormPageSuspense>
      </div>
    </>
  )
}

