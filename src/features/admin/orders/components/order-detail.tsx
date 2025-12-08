import { getOrderById } from "../server/queries"
import { OrderDetailClient, type OrderDetailData } from "./order-detail.client"

export interface OrderDetailProps {
  orderId: string
  backUrl?: string
}

export async function OrderDetail({ orderId, backUrl = "/admin/orders" }: OrderDetailProps) {
  const order = await getOrderById(orderId)

  if (!order) {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Không tìm thấy</h2>
          <p className="text-muted-foreground">Đơn hàng không tồn tại</p>
        </div>
      </div>
    )
  }

  return <OrderDetailClient orderId={orderId} order={order as OrderDetailData} backUrl={backUrl} />
}

