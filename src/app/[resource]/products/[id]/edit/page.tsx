import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { ProductEdit } from "@/features/admin/products/components"
import { validateRouteId } from "@/lib/validation/route-params"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getProductById } from "@/features/admin/products/server/queries"
import { createEditBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"

/**
 * Product Edit Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên product data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Chỉnh sửa {Product Name} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    return {
      title: "Không tìm thấy",
      description: "Sản phẩm không tồn tại",
    }
  }

  return {
    title: `Chỉnh sửa ${product.name || "sản phẩm"}`,
    description: `Chỉnh sửa thông tin sản phẩm: ${product.name}`,
  }
}

/**
 * Product Edit Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 * - ProductEdit component sử dụng Promise.all để fetch product và categories song song
 */
async function ProductEditContent({ productId }: { productId: string }) {
  return (
    <ProductEdit
      productId={productId}
      variant="page"
      backUrl={`/admin/products/${productId}`}
      backLabel="Quay lại chi tiết"
    />
  )
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Fetch product data (non-cached) để hiển thị tên trong breadcrumb
  // Theo chuẩn Next.js 16: không cache admin data
  const product = await getProductById(id)
  const productName = truncateBreadcrumbLabel(product?.name || "Chi tiết")
  
  // Validate route ID
  const validatedId = validateRouteId(id, "Sản phẩm")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createEditBreadcrumbs({
            listLabel: "Products",
            listPath: "/admin/products",
            detailLabel: productName,
            detailPath: `/admin/products/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID sản phẩm không hợp lệ.
              </p>
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
          listLabel: "Products",
          listPath: "/admin/products",
          detailLabel: productName,
          detailPath: `/admin/products/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={10} sectionCount={3}>
          <ProductEditContent productId={validatedId} />
        </FormPageSuspense>
      </div>
    </>
  )
}

