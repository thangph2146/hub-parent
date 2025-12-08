"use server"

import { Prisma } from "@prisma/client"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { mapOrderRecord, type OrderWithRelations } from "./helpers"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  logTableStatusAfterMutation,
  logActionFlow,
  logDetailAction,
  type AuthContext,
} from "@/features/admin/resources/server"
import type { BulkActionResult } from "@/features/admin/resources/types"
import { createOrderSchema, updateOrderSchema, type CreateOrderInput, type UpdateOrderInput } from "./schemas"
import { notifySuperAdminsOfOrderAction } from "./notifications"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext, type BulkActionResult }

function sanitizeOrder(order: OrderWithRelations) {
  return mapOrderRecord(order)
}

function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORD-${timestamp}-${random}`
}

export async function createOrder(ctx: AuthContext, input: CreateOrderInput, skipPermissionCheck = false) {
  const startTime = Date.now()
  
  logActionFlow("orders", "create", "start", { actorId: ctx.actorId })
  // Skip permission check for public orders (checkout)
  if (!skipPermissionCheck) {
    ensurePermission(ctx, PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_MANAGE)
  }

  const validated = createOrderSchema.parse(input)

  // Generate unique order number
  let orderNumber = generateOrderNumber()
  let exists = await prisma.order.findUnique({ where: { orderNumber } })
  while (exists) {
    orderNumber = generateOrderNumber()
    exists = await prisma.order.findUnique({ where: { orderNumber } })
  }

  // Create order with items using transaction
  const order = await prisma.$transaction(async (tx) => {
    // First, validate stock for all items with row locking to prevent race conditions
    const stockValidationErrors: string[] = []
    
    for (const item of validated.items) {
      // Lock product row for update
      const product = await tx.$queryRaw<Array<{ id: string; stock: number; name: string; trackInventory: boolean }>>(
        Prisma.sql`
          SELECT id, stock, name, "trackInventory"
          FROM products
          WHERE id = ${item.productId}::text
          FOR UPDATE
        `
      )

      if (!product || product.length === 0) {
        stockValidationErrors.push(`Sản phẩm "${item.productName}" không tồn tại`)
        continue
      }

      const productData = product[0]

      // Check stock availability
      if (productData.stock < item.quantity) {
        stockValidationErrors.push(
          `Sản phẩm "${item.productName}" không đủ số lượng. Còn lại: ${productData.stock} sản phẩm`
        )
      }
    }

    // If any stock validation failed, throw error before creating order
    if (stockValidationErrors.length > 0) {
      throw new Error(stockValidationErrors.join(", "))
    }

    // Create order
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: validated.customerId,
        customerEmail: validated.customerEmail,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        status: validated.status,
        paymentStatus: validated.paymentStatus,
        paymentMethod: validated.paymentMethod,
        shippingAddress: validated.shippingAddress as Prisma.InputJsonValue,
        billingAddress: validated.billingAddress as Prisma.InputJsonValue,
        subtotal: validated.subtotal,
        tax: validated.tax,
        shipping: validated.shipping,
        discount: validated.discount,
        total: validated.total,
        notes: validated.notes,
      },
    })

    // Create order items
    await tx.orderItem.createMany({
      data: validated.items.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    })

    // Update product stock and inventory atomically
    for (const item of validated.items) {
      // Update product stock directly
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })

      // Update inventory if tracking is enabled
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { inventory: true },
      })

      if (product && product.trackInventory && product.inventory) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
            reserved: {
              increment: item.quantity,
            },
          },
        })
      }
    }

    // Fetch with relations
    return tx.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  })

  if (!order) {
    throw new ApplicationError("Không thể tạo đơn hàng", 500)
  }

  const sanitized = sanitizeOrder(order as OrderWithRelations)

  // Notify super admins of new order
  await notifySuperAdminsOfOrderAction("create", ctx.actorId || "system", {
    id: sanitized.id,
    orderNumber: sanitized.orderNumber,
    customerName: sanitized.customerName,
    customerEmail: sanitized.customerEmail,
    total: sanitized.total,
  })

  logActionFlow("orders", "create", "success", { orderId: sanitized.id, orderNumber: sanitized.orderNumber }, startTime)
  logDetailAction("orders", "create", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export async function updateOrder(
  ctx: AuthContext,
  orderId: string,
  input: UpdateOrderInput
) {
  const startTime = Date.now()
  
  logActionFlow("orders", "update", "start", { orderId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_MANAGE)

  const validated = updateOrderSchema.parse(input)

  const existing = await prisma.order.findUnique({ where: { id: orderId } })
  if (!existing) {
    logActionFlow("orders", "update", "error", { orderId, error: "Order not found" })
    throw new NotFoundError("Đơn hàng không tồn tại")
  }

  const updateData: Prisma.OrderUpdateInput = {}
  
  if (validated.status !== undefined) updateData.status = validated.status
  if (validated.paymentStatus !== undefined) updateData.paymentStatus = validated.paymentStatus
  if (validated.paymentMethod !== undefined) updateData.paymentMethod = validated.paymentMethod
  if (validated.shippingAddress !== undefined) updateData.shippingAddress = validated.shippingAddress as Prisma.InputJsonValue
  if (validated.billingAddress !== undefined) updateData.billingAddress = validated.billingAddress as Prisma.InputJsonValue
  if (validated.notes !== undefined) updateData.notes = validated.notes

  const order = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      items: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const sanitized = sanitizeOrder(order as OrderWithRelations)

  // Track changes for notification
  const changes: {
    status?: { old: string; new: string }
    paymentStatus?: { old: string; new: string }
  } = {}
  if (validated.status !== undefined && validated.status !== existing.status) {
    changes.status = { old: existing.status, new: validated.status }
  }
  if (validated.paymentStatus !== undefined && validated.paymentStatus !== existing.paymentStatus) {
    changes.paymentStatus = { old: existing.paymentStatus, new: validated.paymentStatus }
  }

  // Notify super admins if there are significant changes
  if (Object.keys(changes).length > 0) {
    await notifySuperAdminsOfOrderAction("update", ctx.actorId || "system", {
      id: sanitized.id,
      orderNumber: sanitized.orderNumber,
      customerName: sanitized.customerName,
      customerEmail: sanitized.customerEmail,
      total: sanitized.total,
    }, changes)
  }

  logActionFlow("orders", "update", "success", { orderId: sanitized.id }, startTime)
  logDetailAction("orders", "update", sanitized.id, sanitized as unknown as Record<string, unknown>)

  return sanitized
}

export async function deleteOrder(ctx: AuthContext, orderId: string) {
  const startTime = Date.now()
  
  logActionFlow("orders", "delete", "start", { orderId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.ORDERS_DELETE, PERMISSIONS.ORDERS_MANAGE)

  const existing = await prisma.order.findUnique({ where: { id: orderId } })
  if (!existing) {
    throw new NotFoundError("Đơn hàng không tồn tại")
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: new Date() },
  })

  logActionFlow("orders", "delete", "success", { orderId }, startTime)
  await logTableStatusAfterMutation({
    resource: "orders",
    action: "delete",
    prismaModel: prisma.order,
    affectedIds: orderId,
  })
}

export async function restoreOrder(ctx: AuthContext, orderId: string) {
  const startTime = Date.now()
  
  logActionFlow("orders", "restore", "start", { orderId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_MANAGE)

  const existing = await prisma.order.findUnique({ where: { id: orderId } })
  if (!existing) {
    throw new NotFoundError("Đơn hàng không tồn tại")
  }

  if (!existing.deletedAt) {
    throw new ApplicationError("Đơn hàng chưa bị xóa", 400)
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { deletedAt: null },
  })

  logActionFlow("orders", "restore", "success", { orderId }, startTime)
  await logTableStatusAfterMutation({
    resource: "orders",
    action: "restore",
    prismaModel: prisma.order,
    affectedIds: orderId,
  })
}

export async function hardDeleteOrder(ctx: AuthContext, orderId: string) {
  const startTime = Date.now()
  
  logActionFlow("orders", "hard-delete", "start", { orderId, actorId: ctx.actorId })
  ensurePermission(ctx, PERMISSIONS.ORDERS_MANAGE)

  const existing = await prisma.order.findUnique({ where: { id: orderId } })
  if (!existing) {
    throw new NotFoundError("Đơn hàng không tồn tại")
  }

  await prisma.$transaction(async (tx) => {
    // Delete related records first
    await tx.orderItem.deleteMany({ where: { orderId } })
    
    // Delete order
    await tx.order.delete({ where: { id: orderId } })
  })

  logActionFlow("orders", "hard-delete", "success", { orderId }, startTime)
  await logTableStatusAfterMutation({
    resource: "orders",
    action: "delete",
    prismaModel: prisma.order,
    affectedIds: orderId,
  })
}

