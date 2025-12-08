/**
 * Public API Route: GET /api/public/orders
 * 
 * Get orders for the current user (authenticated) or by order number and email (guest)
 * 
 * Query Parameters:
 * - orderNumber: string (optional, for guest lookup)
 * - email: string (optional, required with orderNumber for guest lookup)
 * 
 * @public - No authentication required for guest lookup, but requires auth for user orders
 */
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/database"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get("orderNumber")
    const email = searchParams.get("email")

    // If user is authenticated, return their orders
    if (session?.user?.id) {
      const orders = await prisma.order.findMany({
        where: {
          customerId: session.user.id,
          deletedAt: null,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 50, // Limit to last 50 orders
      })

      interface OrderWithItems {
        id: string
        orderNumber: string
        status: string
        paymentStatus: string
        paymentMethod: string | null
        customerName: string
        customerEmail: string
        customerPhone: string | null
        shippingAddress: unknown
        billingAddress: unknown
        subtotal: { toString(): string }
        tax: { toString(): string }
        shipping: { toString(): string }
        discount: { toString(): string }
        total: { toString(): string }
        notes: string | null
        createdAt: Date
        updatedAt: Date
        items: Array<{
          id: string
          productId: string
          productName: string
          productSku: string
          quantity: number
          price: { toString(): string }
          total: { toString(): string }
          product?: { images: Array<{ url: string }> } | null
        }>
      }

      return createSuccessResponse({
        data: orders.map((order: OrderWithItems) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          subtotal: order.subtotal.toString(),
          tax: order.tax.toString(),
          shipping: order.shipping.toString(),
          discount: order.discount.toString(),
          total: order.total.toString(),
          notes: order.notes,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            price: typeof item.price === "object" && "toString" in item.price ? item.price.toString() : String(item.price),
            total: typeof item.total === "object" && "toString" in item.total ? item.total.toString() : String(item.total),
            productImage: item.product?.images[0]?.url || null,
          })),
        })),
      })
    }

    // Guest lookup by order number and email
    if (orderNumber && email) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          customerEmail: email.toLowerCase(),
          deletedAt: null,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      })

      if (!order) {
        return createErrorResponse("Không tìm thấy đơn hàng", { status: 404 })
      }

      return createSuccessResponse({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          subtotal: order.subtotal.toString(),
          tax: order.tax.toString(),
          shipping: order.shipping.toString(),
          discount: order.discount.toString(),
          total: order.total.toString(),
          notes: order.notes,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            price: typeof item.price === "object" && "toString" in item.price ? item.price.toString() : String(item.price),
            total: typeof item.total === "object" && "toString" in item.total ? item.total.toString() : String(item.total),
            productImage: item.product?.images[0]?.url || null,
          })),
        },
      })
    }

    return createErrorResponse("Vui lòng đăng nhập hoặc cung cấp orderNumber và email", { status: 400 })
  } catch (error: unknown) {
    console.error("Error fetching orders:", error)
    return createErrorResponse(
      error instanceof Error ? error.message : "Không thể lấy thông tin đơn hàng",
      { status: 500 }
    )
  }
}

