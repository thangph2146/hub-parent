import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/database"
import { validatePagination, buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import { mapOrderRecord, buildWhereClause } from "./helpers"

export interface ListOrdersInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface ListedOrder {
  id: string
  orderNumber: string
  customerId: string | null
  customerEmail: string
  customerName: string
  customerPhone: string | null
  status: string
  paymentStatus: string
  subtotal: string
  tax: string
  shipping: string
  discount: string
  total: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  items?: Array<{
    id: string
    productName: string
    productSku: string
    quantity: number
    price: string
    total: string
  }>
}

export interface OrderDetail extends ListedOrder {
  notes: string | null
  shippingAddress: Prisma.JsonValue | null
  billingAddress: Prisma.JsonValue | null
  paymentMethod: string | null
}

export interface ListOrdersResult {
  data: ListedOrder[]
  pagination: ResourcePagination
}

const ORDER_INCLUDE = {
  items: true,
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrderInclude

export async function listOrders(params: ListOrdersInput = {}): Promise<ListOrdersResult> {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ])

  return {
    data: orders.map(mapOrderRecord),
    pagination: buildPagination(page, limit, total),
  }
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  })

  if (!order) {
    return null
  }

  return {
    ...mapOrderRecord(order),
    notes: order.notes,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    paymentMethod: order.paymentMethod,
  }
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<OrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: ORDER_INCLUDE,
  })

  if (!order) {
    return null
  }

  return {
    ...mapOrderRecord(order),
    notes: order.notes,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    paymentMethod: order.paymentMethod,
  }
}

