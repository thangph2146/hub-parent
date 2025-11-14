import type { Metadata } from "next"
import { AdminHeader } from "@/components/headers"
import { PostCreate } from "@/features/admin/posts/components/post-create"
import { FormPageSuspense } from "@/features/admin/resources/components"

/**
 * Post Create Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tạo bài viết | CMS"
 */
export const metadata: Metadata = {
  title: "Tạo bài viết",
  description: "Tạo bài viết mới",
}

/**
 * Post Create Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 */
async function PostCreateContent() {
  return <PostCreate />
}

export default async function CreatePostPage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Bài viết", href: "/admin/posts" },
          { label: "Tạo mới", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={6} sectionCount={3}>
          <PostCreateContent />
        </FormPageSuspense>
      </div>
    </>
  )
}

