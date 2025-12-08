import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/database"
import { Prisma } from "@prisma/client"

// Update cart item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: "Số lượng không hợp lệ" }, { status: 400 })
    }

    const { id } = await params
    const session = await auth()

    // Require authentication to update cart items
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để cập nhật giỏ hàng" },
        { status: 401 }
      )
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!cart) {
      return NextResponse.json({ error: "Giỏ hàng không tồn tại" }, { status: 404 })
    }

    // Use transaction to ensure atomic stock check and cart update
    await prisma.$transaction(async (tx) => {
      // Find cart item
      const cartItem = await tx.cartItem.findUnique({
        where: { id },
        include: { product: true },
      })

      if (!cartItem || cartItem.cartId !== cart.id) {
        throw new Error("Sản phẩm không tồn tại trong giỏ hàng")
      }

      // Lock product row for update to prevent race conditions
      const product = await tx.$queryRaw<Array<{ id: string; stock: number }>>(
        Prisma.sql`
          SELECT id, stock
          FROM products
          WHERE id = ${cartItem.productId}::text
          FOR UPDATE
        `
      )

      if (!product || product.length === 0) {
        throw new Error("Sản phẩm không tồn tại")
      }

      const productData = product[0]

      // Validate stock with locked row
      if (productData.stock < quantity) {
        throw new Error(
          `Số lượng sản phẩm không đủ. Còn lại: ${productData.stock} sản phẩm`
        )
      }

      await tx.cartItem.update({
        where: { id },
        data: { quantity },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error updating cart item:", error)
    const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật giỏ hàng"
    const statusCode = errorMessage.includes("không tồn tại") ? 404 : 
                      errorMessage.includes("không đủ") ? 400 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

// Delete cart item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    // Require authentication to delete cart items
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng" },
        { status: 401 }
      )
    }

    // Find user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    })

    if (!cart) {
      return NextResponse.json({ error: "Giỏ hàng không tồn tại" }, { status: 404 })
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
    })

    if (!cartItem || cartItem.cartId !== cart.id) {
      return NextResponse.json({ error: "Sản phẩm không tồn tại trong giỏ hàng" }, { status: 404 })
    }

    await prisma.cartItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error deleting cart item:", error)
    return NextResponse.json({ error: "Không thể xóa sản phẩm khỏi giỏ hàng" }, { status: 500 })
  }
}

