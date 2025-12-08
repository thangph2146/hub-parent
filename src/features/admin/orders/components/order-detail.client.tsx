"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { User, Mail, Phone, Package, MapPin, CreditCard, Calendar, Edit, Truck, DollarSign } from "lucide-react"
import { 
  ResourceDetailClient, 
  FieldItem,
  type ResourceDetailField, 
  type ResourceDetailSection 
} from "@/features/admin/resources/components"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useResourceRouter } from "@/hooks/use-resource-segment"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import type { OrderDetail } from "../server/queries"

export interface OrderDetailData extends OrderDetail {
  [key: string]: unknown
}

export interface OrderDetailClientProps {
  orderId: string
  order: OrderDetailData
  backUrl?: string
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đã giao hàng",
  DELIVERED: "Đã nhận hàng",
  CANCELLED: "Đã hủy",
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
  FAILED: "Thanh toán thất bại",
}

export function OrderDetailClient({ orderId, order, backUrl = "/admin/orders" }: OrderDetailClientProps) {
  const router = useResourceRouter()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const canUpdate = hasPermission(PERMISSIONS.ORDERS_UPDATE) || hasPermission(PERMISSIONS.ORDERS_MANAGE)
  const [isUpdating, setIsUpdating] = useState(false)

  // Use order data directly since it's passed as prop
  const orderData = order as OrderDetailData

  const handleStatusUpdate = useCallback(
    async (newStatus: string) => {
      if (!canUpdate) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền cập nhật đơn hàng",
          variant: "destructive",
        })
        return
      }

      setIsUpdating(true)
      try {
        const updateData: { status: string } = { status: newStatus }
        const url = apiRoutes.orders.update(orderId) as string
        await apiClient.put<unknown>(url, updateData)

        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái đơn hàng",
        })
        router.refresh()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error && "response" in error && typeof error.response === "object" && error.response !== null && "data" in error.response && typeof error.response.data === "object" && error.response.data !== null && "message" in error.response.data && typeof error.response.data.message === "string" ? error.response.data.message : "Không thể cập nhật trạng thái"
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsUpdating(false)
      }
    },
    [canUpdate, orderId, router, toast]
  )

  const handlePaymentStatusUpdate = useCallback(
    async (newPaymentStatus: string) => {
      if (!canUpdate) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền cập nhật đơn hàng",
          variant: "destructive",
        })
        return
      }

      setIsUpdating(true)
      try {
        const updateData: { paymentStatus: string } = { paymentStatus: newPaymentStatus }
        const url = apiRoutes.orders.update(orderId) as string
        await apiClient.put<unknown>(url, updateData)

        toast({
          title: "Thành công",
          description: "Đã cập nhật trạng thái thanh toán",
        })
        router.refresh()
      } catch (error: unknown) {
        const errorMessage = error instanceof Error && "response" in error && typeof error.response === "object" && error.response !== null && "data" in error.response && typeof error.response.data === "object" && error.response.data !== null && "message" in error.response.data && typeof error.response.data.message === "string" ? error.response.data.message : "Không thể cập nhật trạng thái thanh toán"
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsUpdating(false)
      }
    },
    [canUpdate, orderId, router, toast]
  )


  const detailFields: ResourceDetailField<OrderDetailData>[] = []

  const detailSections: ResourceDetailSection<OrderDetailData>[] = [
    {
      id: "order-info",
      title: "Thông tin đơn hàng",
      description: "Mã đơn hàng và trạng thái",
      fieldsContent: (_fields, data) => {
        const orderInfo = (data || order) as OrderDetailData
        
        return (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={Package} label="Mã đơn hàng">
                <div className="text-sm font-medium text-foreground font-mono">
                  #{orderInfo.orderNumber}
                </div>
              </FieldItem>

              <FieldItem icon={Calendar} label="Ngày tạo">
                <div className="text-sm font-medium text-foreground">
                  {new Date(orderInfo.createdAt).toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </FieldItem>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={Truck} label="Trạng thái đơn hàng">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[orderInfo.status] || "bg-gray-100 text-gray-800"}>
                    {statusLabels[orderInfo.status] || orderInfo.status}
                  </Badge>
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextStatus = 
                          orderInfo.status === "PENDING" ? "PROCESSING" :
                          orderInfo.status === "PROCESSING" ? "SHIPPED" :
                          orderInfo.status === "SHIPPED" ? "DELIVERED" :
                          "PENDING"
                        handleStatusUpdate(nextStatus)
                      }}
                      disabled={isUpdating || orderInfo.status === "DELIVERED" || orderInfo.status === "CANCELLED"}
                    >
                      Cập nhật
                    </Button>
                  )}
                </div>
              </FieldItem>

              <FieldItem icon={DollarSign} label="Trạng thái thanh toán">
                <div className="flex items-center gap-2">
                  <Badge className={paymentStatusColors[orderInfo.paymentStatus] || "bg-gray-100 text-gray-800"}>
                    {paymentStatusLabels[orderInfo.paymentStatus] || orderInfo.paymentStatus}
                  </Badge>
                  {canUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextPaymentStatus = orderInfo.paymentStatus === "PENDING" ? "PAID" : "PENDING"
                        handlePaymentStatusUpdate(nextPaymentStatus)
                      }}
                      disabled={isUpdating || orderInfo.paymentStatus === "PAID"}
                    >
                      Cập nhật
                    </Button>
                  )}
                </div>
              </FieldItem>
            </div>
          </div>
        )
      },
    },
    {
      id: "customer-info",
      title: "Thông tin khách hàng",
      description: "Thông tin liên hệ khách hàng",
      fieldsContent: (_fields, data) => {
        const customerInfo = (data || order) as OrderDetailData
        
        return (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={User} label="Tên khách hàng">
                <div className="text-sm font-medium text-foreground">
                  {customerInfo.customerName || "—"}
                </div>
              </FieldItem>

              <FieldItem icon={Mail} label="Email">
                <a
                  href={`mailto:${customerInfo.customerEmail}`}
                  className="text-sm font-medium text-primary hover:underline truncate block transition-colors"
                >
                  {customerInfo.customerEmail || "—"}
                </a>
              </FieldItem>
            </div>

            {customerInfo.customerPhone && (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                <FieldItem icon={Phone} label="Số điện thoại">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${customerInfo.customerPhone}`}
                      className="text-sm font-medium text-primary hover:underline transition-colors"
                    >
                      {customerInfo.customerPhone}
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`tel:${customerInfo.customerPhone}`, "_self")
                      }}
                    >
                      Gọi ngay
                    </Button>
                  </div>
                </FieldItem>

                <FieldItem icon={Mail} label="Gửi email">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(`mailto:${customerInfo.customerEmail}?subject=Đơn hàng ${customerInfo.orderNumber}`, "_self")
                    }}
                  >
                    Gửi email
                  </Button>
                </FieldItem>
              </div>
            )}

            {customerInfo.customerId && (
              <FieldItem icon={User} label="Tài khoản">
                <div className="text-sm font-medium text-foreground">
                  Đã đăng nhập (ID: {customerInfo.customerId})
                </div>
              </FieldItem>
            )}
          </div>
        )
      },
    },
    {
      id: "order-items",
      title: "Sản phẩm đã đặt",
      description: "Danh sách sản phẩm trong đơn hàng",
      fieldsContent: (_fields, data) => {
        const itemsInfo = (data || order) as OrderDetailData
        const items = itemsInfo.items || []
        
        if (items.length === 0) {
          return (
            <div className="text-sm text-muted-foreground">Không có sản phẩm nào</div>
          )
        }

        return (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium mb-1">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">SKU: {item.productSku}</div>
                    <div className="text-sm text-muted-foreground">Số lượng: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseFloat(item.total))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(parseFloat(item.price))} / sản phẩm
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      },
    },
    {
      id: "addresses",
      title: "Địa chỉ giao hàng & thanh toán",
      description: "Thông tin địa chỉ",
      fieldsContent: (_fields, data) => {
        const addressInfo = (data || order) as OrderDetailData
        const shippingAddress = addressInfo.shippingAddress as Record<string, unknown> | null
        const billingAddress = addressInfo.billingAddress as Record<string, unknown> | null
        
        // Type-safe address interface
        interface Address {
          address?: string
          city?: string
          district?: string
          ward?: string
          postalCode?: string
        }
        
        const shippingAddr = shippingAddress as Address | null
        const billingAddr = billingAddress as Address | null
        
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Địa chỉ giao hàng
              </h4>
              {shippingAddr ? (
                <Card className="p-4">
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{shippingAddr.address || ""}</div>
                    <div className="text-muted-foreground">
                      {shippingAddr.ward || ""}, {shippingAddr.district || ""}, {shippingAddr.city || ""}
                    </div>
                    {shippingAddr.postalCode && (
                      <div className="text-muted-foreground">Mã bưu điện: {shippingAddr.postalCode}</div>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="text-sm text-muted-foreground">Không có địa chỉ giao hàng</div>
              )}
            </div>

            {billingAddr && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Địa chỉ thanh toán
                </h4>
                <Card className="p-4">
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{billingAddr.address || ""}</div>
                    <div className="text-muted-foreground">
                      {billingAddr.ward || ""}, {billingAddr.district || ""}, {billingAddr.city || ""}
                    </div>
                    {billingAddr.postalCode && (
                      <div className="text-muted-foreground">Mã bưu điện: {billingAddr.postalCode}</div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "payment",
      title: "Thanh toán",
      description: "Thông tin thanh toán và tổng tiền",
      fieldsContent: (_fields, data) => {
        const paymentInfo = (data || order) as OrderDetailData
        
        return (
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <FieldItem icon={CreditCard} label="Phương thức thanh toán">
                <div className="text-sm font-medium text-foreground">
                  {paymentInfo.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" :
                   paymentInfo.paymentMethod === "bank_transfer" ? "Chuyển khoản ngân hàng" :
                   paymentInfo.paymentMethod === "credit_card" ? "Thẻ tín dụng" :
                   paymentInfo.paymentMethod === "e_wallet" ? "Ví điện tử" :
                   paymentInfo.paymentMethod || "—"}
                </div>
              </FieldItem>
            </div>

            <Card className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(parseFloat(paymentInfo.subtotal))}
                </span>
              </div>
              {parseFloat(paymentInfo.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thuế:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(parseFloat(paymentInfo.tax))}
                  </span>
                </div>
              )}
              {parseFloat(paymentInfo.shipping) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(parseFloat(paymentInfo.shipping))}
                  </span>
                </div>
              )}
              {parseFloat(paymentInfo.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giảm giá:</span>
                  <span className="font-medium text-green-600">
                    -{new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(parseFloat(paymentInfo.discount))}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Tổng cộng:</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(parseFloat(paymentInfo.total))}
                </span>
              </div>
            </Card>
          </div>
        )
      },
    },
    {
      id: "notes",
      title: "Ghi chú",
      description: "Ghi chú của khách hàng",
      fieldsContent: (_fields, data) => {
        const notesInfo = (data || order) as OrderDetailData
        
        if (!notesInfo.notes) {
          return (
            <div className="text-sm text-muted-foreground">Không có ghi chú</div>
          )
        }

        return (
          <Card className="p-4">
            <div className="text-sm whitespace-pre-wrap">{notesInfo.notes}</div>
          </Card>
        )
      },
    },
  ]

  return (
    <ResourceDetailClient<OrderDetailData>
      data={orderData}
      fields={detailFields}
      detailSections={detailSections}
      title={`Đơn hàng #${orderData.orderNumber}`}
      description={`Chi tiết đơn hàng từ ${orderData.customerName}`}
      backUrl={backUrl}
      isLoading={false}
      actions={
        canUpdate ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/orders/${orderId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        ) : undefined
      }
    />
  )
}

