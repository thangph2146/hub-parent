import type { Prisma } from "@prisma/client"
import {
  serializeDate,
  applyDateFilter,
} from "@/features/admin/resources/server"
import type { ListOrdersInput, ListedOrder, OrderDetail } from "./queries"
import type { OrderRow } from "../types"

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true
    customer: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

export function mapOrderRecord(order: OrderWithRelations): ListedOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal.toString(),
    tax: order.tax.toString(),
    shipping: order.shipping.toString(),
    discount: order.discount.toString(),
    total: order.total.toString(),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    deletedAt: order.deletedAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      price: item.price.toString(),
      total: item.total.toString(),
    })),
  }
}

export function buildWhereClause(params: ListOrdersInput): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {}

  // Status filter
  if (params.status) {
    if (params.status === "deleted") {
      where.deletedAt = { not: null }
    } else if (params.status === "active") {
      where.deletedAt = null
    }
  }

  // Search filter
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: "insensitive" } },
      { customerName: { contains: params.search, mode: "insensitive" } },
      { customerEmail: { contains: params.search, mode: "insensitive" } },
      { customerPhone: { contains: params.search, mode: "insensitive" } },
    ]
  }

  // Additional filters
  if (params.filters) {
    if (params.filters.status) {
      (where as { status?: string }).status = params.filters.status as string
    }
    if (params.filters.paymentStatus) {
      (where as { paymentStatus?: string }).paymentStatus = params.filters.paymentStatus as string
    }
    if (params.filters.createdAt) {
      applyDateFilter(where, "createdAt", params.filters.createdAt)
    }
  }

  return where
}

export function serializeOrdersList(result: { data: ListedOrder[]; pagination: { total: number; page: number; limit: number; totalPages: number } }): {
  rows: OrderRow[]
  total: number
  totalPages: number
  limit: number
  page: number
} {
  return {
    rows: result.data.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      createdAt: serializeDate(order.createdAt) || "",
      updatedAt: serializeDate(order.updatedAt) || undefined,
      deletedAt: order.deletedAt ? serializeDate(order.deletedAt) : null,
      items: order.items,
    })),
    total: result.pagination.total,
    totalPages: result.pagination.totalPages,
    limit: result.pagination.limit,
    page: result.pagination.page,
  }
}

export function serializeOrderForTable(order: ListedOrder): OrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt: serializeDate(order.createdAt) || "",
    updatedAt: serializeDate(order.updatedAt) || undefined,
    deletedAt: order.deletedAt ? serializeDate(order.deletedAt) : null,
    items: order.items,
  }
}

export function serializeOrderDetail(order: OrderDetail) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    notes: order.notes,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    createdAt: serializeDate(order.createdAt)!,
    updatedAt: serializeDate(order.updatedAt)!,
    deletedAt: serializeDate(order.deletedAt),
    items: order.items || [],
  }
}

