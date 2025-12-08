import type { Metadata } from "next"
import { AdminHeader } from "@/components/layouts/headers"
import { OrderDetail } from "@/features/admin/orders/components/order-detail"
import { validateRouteId } from "@/lib/validation/route-params"
import { FormPageSuspense } from "@/features/admin/resources/components"
import { getOrderById } from "@/features/admin/orders/server/queries"
import { createDetailBreadcrumbs, getResourceSegmentFromParams, truncateBreadcrumbLabel } from "@/features/admin/resources/utils"
import { applyResourceSegmentToPath } from "@/lib/permissions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ resource?: string; id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const order = await getOrderById(id)

  if (!order) {
    return {
      title: "Không tìm thấy",
      description: "Đơn hàng không tồn tại",
    }
  }

  return {
    title: `Đơn hàng #${order.orderNumber}`,
    description: `Chi tiết đơn hàng #${order.orderNumber} - ${order.customerName}`,
  }
}

async function OrderDetailContent({ orderId, resourceSegment }: { orderId: string; resourceSegment: string }) {
  const backUrl = applyResourceSegmentToPath("/admin/orders", resourceSegment)
  return <OrderDetail orderId={orderId} backUrl={backUrl} />
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ resource?: string; id: string }>
}) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const resourceSegment = getResourceSegmentFromParams(resolvedParams.resource)
  
  const order = await getOrderById(id)
  const orderLabel = truncateBreadcrumbLabel(order ? `#${order.orderNumber}` : "Chi tiết")
  
  const validatedId = validateRouteId(id, "Đơn hàng")
  if (!validatedId) {
    return (
      <>
        <AdminHeader
          breadcrumbs={createDetailBreadcrumbs({
            resourceSegment,
            listLabel: "Đơn hàng",
            listPath: "/admin/orders",
            detailLabel: orderLabel,
            detailPath: `/admin/orders/${id}`,
          })}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex min-h-[400px] flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-bold">ID không hợp lệ</h2>
              <p className="text-muted-foreground">
                ID đơn hàng không hợp lệ.
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
          resourceSegment,
          listLabel: "Đơn hàng",
          listPath: "/admin/orders",
          detailLabel: orderLabel,
          detailPath: `/admin/orders/${id}`,
        })}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <FormPageSuspense fieldCount={8} sectionCount={6}>
          <OrderDetailContent orderId={validatedId} resourceSegment={resourceSegment} />
        </FormPageSuspense>
      </div>
    </>
  )
}

