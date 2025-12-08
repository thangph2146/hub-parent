"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku: string
  quantity: number
  price: string
  total: string
  productImage: string | null
  productSlug: string | null
}

interface ShippingAddress {
  address: string
  city: string
  district: string
  ward: string
  postalCode?: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: ShippingAddress | null
  billingAddress: ShippingAddress | null
  subtotal: string
  tax: string
  shipping: string
  discount: string
  total: string
  notes: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

const ORDERS_QUERY_KEY = ["public-orders"]

async function getOrders(orderNumber?: string, email?: string) {
  if (orderNumber && email) {
    const response = await apiClient.get(`/api/public/orders/${orderNumber}`, {
      params: { email },
    })
    return { data: [response.data.data] }
  }
  const response = await apiClient.get("/api/public/orders")
  return response.data
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [searchOrderNumber, setSearchOrderNumber] = useState<string | null>(null)
  const [searchEmail, setSearchEmail] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: [...ORDERS_QUERY_KEY, searchOrderNumber, searchEmail],
    queryFn: () => getOrders(searchOrderNumber || undefined, searchEmail || undefined),
    enabled: !!session?.user?.id || (!!searchOrderNumber && !!searchEmail),
  })

  const handleSearch = () => {
    if (orderNumber && email) {
      setSearchOrderNumber(orderNumber)
      setSearchEmail(email)
    }
  }

  const orders: Order[] = data?.data || []

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Chờ xử lý",
      CONFIRMED: "Đã xác nhận",
      PROCESSING: "Đang xử lý",
      SHIPPED: "Đã giao hàng",
      DELIVERED: "Đã nhận hàng",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
    }
    return statusMap[status] || status
  }

  const getPaymentStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      FAILED: "Thanh toán thất bại",
      REFUNDED: "Đã hoàn tiền",
      PARTIALLY_REFUNDED: "Hoàn tiền một phần",
    }
    return statusMap[status] || status
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Đơn hàng của tôi</h1>

      {!session?.user?.id && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tra cứu đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderNumber">Mã đơn hàng</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Nhập mã đơn hàng"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email đặt hàng</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email đã dùng để đặt hàng"
                className="mt-1"
              />
            </div>
            <Button onClick={handleSearch} className="w-full sm:w-auto" disabled={!orderNumber || !email}>
              Tra cứu
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              {error instanceof Error ? error.message : "Không thể tải đơn hàng"}
            </p>
            <Button asChild variant="outline">
              <Link href="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào</p>
            <Button asChild>
              <Link href="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Đơn hàng #{order.orderNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Thông tin khách hàng</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Tên:</span> {order.customerName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email:</span> {order.customerEmail}
                      </p>
                      {order.customerPhone && (
                        <p>
                          <span className="text-muted-foreground">Điện thoại:</span>{" "}
                          <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                            {order.customerPhone}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Địa chỉ giao hàng</h4>
                    {order.shippingAddress && typeof order.shippingAddress === "object" && (
                      <div className="space-y-1 text-sm">
                        <p>{order.shippingAddress.address}</p>
                        <p>
                          {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Sản phẩm</h4>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        {item.productImage && (
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm">
                            {item.productSlug ? (
                              <Link href={`/san-pham/${item.productSlug}`} className="hover:text-primary">
                                {item.productName}
                              </Link>
                            ) : (
                              item.productName
                            )}
                          </h5>
                          <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                          <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(parseFloat(item.total))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(parseFloat(order.subtotal))}
                      </span>
                    </div>
                    {parseFloat(order.tax) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Thuế:</span>
                        <span>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(parseFloat(order.tax))}
                        </span>
                      </div>
                    )}
                    {parseFloat(order.shipping) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phí vận chuyển:</span>
                        <span>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(parseFloat(order.shipping))}
                        </span>
                      </div>
                    )}
                    {parseFloat(order.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>
                          -{new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(parseFloat(order.discount))}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Tổng cộng:</span>
                      <span>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(parseFloat(order.total))}
                      </span>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Ghi chú</h4>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
