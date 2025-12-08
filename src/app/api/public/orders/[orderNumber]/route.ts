/**
 * Public API Route: GET /api/public/orders/[orderNumber]
 * 
 * Get a specific order by order number (for guest users)
 * Requires email query parameter for verification
 * 
 * @public - No authentication required, but email verification needed
 */
import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/database"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params
    const session = await auth()
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")

    // If user is authenticated, they can view their own orders
    if (session?.user?.id) {
      const order = await prisma.order.findFirst({
        where: {
          orderNumber,
          customerId: session.user.id,
          deletedAt: null,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { order: "asc" },
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
            price: item.price.toString(),
            total: item.total.toString(),
            productImage: item.product?.images[0]?.url || null,
            productSlug: item.product?.slug || null,
          })),
        },
      })
    }

    // Guest lookup requires email verification
    if (!email) {
      return createErrorResponse("Email là bắt buộc để xem đơn hàng", { status: 400 })
    }

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
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    })

    if (!order) {
      return createErrorResponse("Không tìm thấy đơn hàng với email này", { status: 404 })
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
          price: item.price.toString(),
          total: item.total.toString(),
          productImage: item.product?.images[0]?.url || null,
          productSlug: item.product?.slug || null,
        })),
      },
    })
  } catch (error: unknown) {
    console.error("Error fetching order:", error)
    return createErrorResponse(
      error instanceof Error ? error.message : "Không thể lấy thông tin đơn hàng",
      { status: 500 }
    )
  }
}

