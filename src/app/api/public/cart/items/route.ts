import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/database"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/config/logger"

// Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 })
    }

    const session = await auth()

    // Require authentication to add items to cart
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng" },
        { status: 401 }
      )
    }

    // Get or create cart for authenticated user
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Use transaction to ensure atomic stock check and cart update
    await prisma.$transaction(async (tx) => {
      // Lock product row for update to prevent race conditions
      // Using Prisma.sql for parameterized query with FOR UPDATE lock
      const product = await tx.$queryRaw<Array<{ id: string; stock: number; status: string; deletedAt: Date | null }>>(
        Prisma.sql`
          SELECT id, stock, status, "deletedAt"
          FROM products
          WHERE id = ${productId}::text
            AND status = 'ACTIVE'
            AND "deletedAt" IS NULL
          FOR UPDATE
        `
      )

      if (!product || product.length === 0) {
        throw new Error("Sản phẩm không tồn tại hoặc không khả dụng")
      }

      const productData = product[0]

      // Check if item already exists in cart
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      })

      const requestedQuantity = existingItem ? existingItem.quantity + quantity : quantity

      // Validate stock with locked row
      if (productData.stock < requestedQuantity) {
        throw new Error(
          `Số lượng sản phẩm không đủ. Còn lại: ${productData.stock} sản phẩm`
        )
      }

      if (existingItem) {
        // Update quantity
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: requestedQuantity,
          },
        })
      } else {
        // Create new item
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error("Error adding to cart:", { error })
    const errorMessage = error instanceof Error ? error.message : "Không thể thêm sản phẩm vào giỏ hàng"
    const statusCode = errorMessage.includes("không tồn tại") ? 404 : 
                      errorMessage.includes("không đủ") ? 400 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

