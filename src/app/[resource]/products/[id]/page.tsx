import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { ProductDetail } from "@/features/admin/products/components"
import { validateRouteId } from "@/lib/validation/route-params"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getProductById } from "@/features/admin/products/server/queries"
import { createDetailBreadcrumbs, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"

/**
 * Product Detail Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên product data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "{Product Name} | CMS"
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
    title: product.name || "Chi tiết sản phẩm",
    description: `Chi tiết sản phẩm: ${product.name}`,
  }
}

/**
 * Product Detail Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, detail content stream khi ready
 */
async function ProductDetailContent({ productId }: { productId: string }) {
  return <ProductDetail productId={productId} backUrl="/admin/products" />
}

export default async function ProductDetailPage({
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
          breadcrumbs={createDetailBreadcrumbs({
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
        breadcrumbs={createDetailBreadcrumbs({
          listLabel: "Products",
          listPath: "/admin/products",
          detailLabel: productName,
          detailPath: `/admin/products/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={10} sectionCount={3}>
          <ProductDetailContent productId={validatedId} />
        </FormPageSuspense>
      </div>
    </>
  )
}

