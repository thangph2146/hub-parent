import { getOrderByOrderNumber } from "@/features/admin/orders/server/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function OrderSuccessPage({
  params,
}: {
  params: { orderNumber: string }
}) {
  const order = await getOrderByOrderNumber(params.orderNumber)

  if (!order) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-4 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center text-green-600">
            Đặt hàng thành công!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-2">
              Cảm ơn bạn đã đặt hàng. Mã đơn hàng của bạn là:
            </p>
            <p className="text-2xl font-bold">{order.orderNumber}</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Tên khách hàng:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Email:</span>
                <span className="font-medium break-all">{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Số điện thoại:</span>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Trạng thái:</span>
                <span className="font-medium">
                  {order.status === "PENDING" ? "Chờ xử lý" :
                   order.status === "CONFIRMED" ? "Đã xác nhận" :
                   order.status === "PROCESSING" ? "Đang xử lý" :
                   order.status === "SHIPPED" ? "Đã giao hàng" :
                   order.status === "DELIVERED" ? "Đã nhận hàng" :
                   order.status}
                </span>
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tổng tiền:</span>
                <span className="font-bold text-xl text-primary">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(parseFloat(order.total))}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.
            </p>
            <p className="text-sm text-muted-foreground">
              Vui lòng giữ số điện thoại {order.customerPhone || order.customerEmail} để nhận cuộc gọi từ chúng tôi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button asChild className="flex-1 w-full sm:w-auto">
              <Link href="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 w-full sm:w-auto">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

