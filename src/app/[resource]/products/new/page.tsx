import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { ProductCreate } from "@/features/admin/products/components"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { createCreateBreadcrumbs } from "@/features/admin/resources/utils"

/**
 * Product Create Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Tạo sản phẩm | CMS"
 */
export const metadata: Metadata = {
  title: "Tạo sản phẩm",
  description: "Tạo sản phẩm mới trong hệ thống",
}

/**
 * Product Create Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 * - ProductCreate component fetch categories data bên trong
 */
async function ProductCreateContent() {
  return <ProductCreate backUrl="/admin/products" />
}

export default async function ProductCreatePage() {
  return (
    <>
      <AdminHeader
        breadcrumbs={createCreateBreadcrumbs({
          listLabel: "Products",
          listPath: "/admin/products",
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={10} sectionCount={3}>
          <ProductCreateContent />
        </FormPageSuspense>
      </div>
    </>
  )
}

