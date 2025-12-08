import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/database"
import { cookies } from "next/headers"
import { createOrder } from "@/features/admin/orders/server/mutations"
import type { AuthContext } from "@/features/admin/resources/server"
import { z } from "zod"

// Validation schema for checkout
const checkoutSchema = z.object({
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc").max(255, "Tên khách hàng quá dài"),
  customerEmail: z.string().email("Email không hợp lệ").max(255, "Email quá dài"),
  customerPhone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  shippingAddress: z.object({
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
    city: z.string().min(1, "Thành phố là bắt buộc"),
    district: z.string().min(1, "Quận/Huyện là bắt buộc"),
    ward: z.string().min(1, "Phường/Xã là bắt buộc"),
    postalCode: z.string().optional(),
  }),
  billingAddress: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    ward: z.string().min(1),
    postalCode: z.string().optional(),
  }).optional(),
  paymentMethod: z.string().optional(),
  giftCode: z.string().optional(),
  notes: z.string().optional().nullable(),
})

// Create order from cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input with zod
    const validationResult = checkoutSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { success: false, message: firstError?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      paymentMethod,
      giftCode,
      notes,
    } = validationResult.data

    const session = await auth()
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("sessionId")?.value

    // Get cart
    let cart = null
    if (session?.user?.id) {
      cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })
    } else if (sessionId) {
      cart = await prisma.cart.findUnique({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Giỏ hàng trống" },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + parseFloat(item.product.price.toString()) * item.quantity
    }, 0)

    // Validate and apply gift code if provided
    let discount = 0
    let giftCodeId = null
    if (giftCode) {
      const giftCodeRecord = await prisma.giftCode.findUnique({
        where: { code: giftCode.toUpperCase().trim() },
      })

      if (giftCodeRecord && giftCodeRecord.isActive) {
        const now = new Date()
        const isValid =
          (!giftCodeRecord.validUntil || new Date(giftCodeRecord.validUntil) >= now) &&
          new Date(giftCodeRecord.validFrom) <= now &&
          (!giftCodeRecord.usageLimit || giftCodeRecord.usedCount < giftCodeRecord.usageLimit) &&
          (!giftCodeRecord.minOrderAmount || subtotal >= parseFloat(giftCodeRecord.minOrderAmount.toString()))

        if (isValid) {
          giftCodeId = giftCodeRecord.id
          // Calculate discount
          if (giftCodeRecord.discountType === "PERCENTAGE") {
            discount = (subtotal * parseFloat(giftCodeRecord.discountValue.toString())) / 100
            if (giftCodeRecord.maxDiscount) {
              discount = Math.min(discount, parseFloat(giftCodeRecord.maxDiscount.toString()))
            }
          } else {
            discount = parseFloat(giftCodeRecord.discountValue.toString())
          }
          discount = Math.min(discount, subtotal)
          discount = Math.round(discount)
        }
      }
    }

    const tax = 0 // Can be calculated based on location
    const shipping = 0 // Can be calculated based on address
    const total = subtotal + tax + shipping - discount

    // Note: Stock validation will be done in createOrder transaction with row locking
    // This prevents race conditions when multiple users checkout simultaneously

    // Create order with public context (no authentication required)
    // Create a minimal context for public orders
    const ctx: AuthContext = {
      actorId: session?.user?.id || "public",
      permissions: [],
      roles: [],
    }
    // For public orders, we don't require authentication but still need a context
    // The context will be used for logging, not for permission checks
    // Pass skipPermissionCheck=true to allow public orders
    const order = await createOrder(ctx, {
      customerId: session?.user?.id || null,
      customerEmail,
      customerName,
      customerPhone,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: paymentMethod || "cod",
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      notes: notes || null,
      items: cart.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        price: parseFloat(item.product.price.toString()),
        total: parseFloat(item.product.price.toString()) * item.quantity,
      })),
    }, true) // skipPermissionCheck = true for public orders

    // Record gift code usage if applied
    if (giftCodeId) {
      await prisma.$transaction([
        prisma.giftCodeUsage.create({
          data: {
            giftCodeId,
            orderId: order.id,
            userId: session?.user?.id || null,
            discount,
          },
        }),
        prisma.giftCode.update({
          where: { id: giftCodeId },
          data: { usedCount: { increment: 1 } },
        }),
      ])
    }

    // Clear cart after successful order
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: "Đặt hàng thành công",
    })
  } catch (error: unknown) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Không thể đặt hàng. Vui lòng thử lại sau.",
      },
      { status: 500 }
    )
  }
}

