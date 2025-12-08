import type { ResourceResponse, BaseResourceTableClientProps } from "@/features/admin/resources/types"

export interface OrderRow {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  status: string
  paymentStatus: string
  total: string
  createdAt: string
  updatedAt?: string
  deletedAt: string | null
  items?: Array<{
    id: string
    productName: string
    quantity: number
    price: string
    total: string
  }>
}

export type OrdersTableClientProps = BaseResourceTableClientProps<OrderRow>

export type OrdersResponse = ResourceResponse<OrderRow>

