import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { OrderEdit } from "@/features/admin/orders/components"
import { validateRouteId } from "@/lib/validation/route-params"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getOrderById } from "@/features/admin/orders/server/queries"
import { createEditBreadcrumbs, getResourceSegmentFromParams, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"
import { applyResourceSegmentToPath } from "@/lib/permissions"

/**
 * Order Edit Page Metadata (Dynamic)
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng generateMetadata để tạo metadata động dựa trên order data
 * - Metadata được merge với admin layout và root layout
 * - Title sử dụng template từ root: "Chỉnh sửa {Order Number} | CMS"
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource?: string; id: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const { id } = resolvedParams
  const order = await getOrderById(id)

  if (!order) {
    return {
      title: "Không tìm thấy",
      description: "Đơn hàng không tồn tại",
    }
  }

  return {
    title: `Chỉnh sửa đơn hàng #${order.orderNumber}`,
    description: `Chỉnh sửa thông tin đơn hàng #${order.orderNumber}`,
  }
}

/**
 * Order Edit Page với Suspense cho streaming
 * 
 * Theo Next.js 16 best practices:
 * - Header render ngay, form content stream khi ready
 * - OrderEdit component sử dụng Promise.all để fetch order data
 */
async function OrderEditContent({
  orderId,
  resourceSegment,
}: {
  orderId: string
  resourceSegment: string
}) {
  const backUrl = applyResourceSegmentToPath(`/admin/orders/${orderId}`, resourceSegment)
  return (
    <OrderEdit
      orderId={orderId}
      variant="page"
      backUrl={backUrl}
      backLabel="Quay lại chi tiết"
    />
  )
}

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ resource?: string; id: string }>
}) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const resourceSegment = getResourceSegmentFromParams(resolvedParams.resource)

  // Fetch order data (non-cached) để hiển thị tên trong breadcrumb
  // Theo chuẩn Next.js 16: không cache admin data
  const order = await getOrderById(id)
  const orderLabel = truncateBreadcrumbLabel(order ? `#${order.orderNumber}` : "Chi tiết")

  // Validate route ID
  const validatedId = validateRouteId(id, "Đơn hàng")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createEditBreadcrumbs({
            resourceSegment,
            listLabel: "Orders",
            listPath: "/admin/orders",
            detailLabel: orderLabel,
            detailPath: `/admin/orders/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">ID đơn hàng không hợp lệ.</p>
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
          listLabel: "Orders",
          listPath: "/admin/orders",
          detailLabel: orderLabel,
          detailPath: `/admin/orders/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={6} sectionCount={3}>
          <OrderEditContent orderId={validatedId} resourceSegment={resourceSegment} />
        </FormPageSuspense>
      </div>
    </>
  )
}

