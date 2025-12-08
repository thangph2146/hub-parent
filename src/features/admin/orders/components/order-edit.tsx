import { getOrderById } from "../server/queries"
import { serializeOrderDetail } from "../server/helpers"
import { OrderEditClient } from "./order-edit.client"
import type { OrderEditClientProps } from "./order-edit.client"
import { NotFoundMessage } from "@/features/admin/resources/components"
import type { OrderFormData } from "../form-fields"

export interface OrderEditProps {
  orderId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  variant?: "dialog" | "sheet" | "page"
  backUrl?: string
  backLabel?: string
}

export async function OrderEdit({
  orderId,
  open = true,
  onOpenChange,
  onSuccess,
  variant = "dialog",
  backUrl,
  backLabel = "Quay lại",
}: OrderEditProps) {
  const order = await getOrderById(orderId)

  if (!order) {
    return <NotFoundMessage resourceName="đơn hàng" />
  }

  const orderForEdit: OrderEditClientProps["order"] = {
    ...serializeOrderDetail(order),
    status: order.status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED",
    paymentStatus: order.paymentStatus as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED",
    shippingAddress: (order.shippingAddress as OrderFormData["shippingAddress"]) ?? null,
    billingAddress: (order.billingAddress as OrderFormData["billingAddress"]) ?? null,
  }

  return (
    <OrderEditClient
      order={orderForEdit}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      variant={variant}
      backUrl={backUrl}
      backLabel={backLabel}
      orderId={orderId}
    />
  )
}

