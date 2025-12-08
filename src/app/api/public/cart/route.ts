import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/database"

// Get or create cart
export async function GET() {
  try {
    const session = await auth()

    // Require authentication to view cart
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem giỏ hàng" },
        { status: 401 }
      )
    }

    // Get user's cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
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

    // If no cart found, create a new one for the user
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + parseFloat(item.product.price.toString()) * item.quantity
    }, 0)

    const total = subtotal // Add tax, shipping, discount later

    return NextResponse.json({
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        productImage: item.product.images[0]?.url || null,
        price: item.product.price.toString(),
        quantity: item.quantity,
        total: (parseFloat(item.product.price.toString()) * item.quantity).toString(),
      })),
      subtotal: subtotal.toString(),
      total: total.toString(),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    })
  } catch (error: unknown) {
    console.error("Error getting cart:", error)
    return NextResponse.json({ error: "Không thể lấy giỏ hàng" }, { status: 500 })
  }
}

// Clear cart
export async function DELETE() {
  try {
    const session = await auth()

    // Require authentication to clear cart
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xóa giỏ hàng" },
        { status: 401 }
      )
    }

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Error clearing cart:", error)
    return NextResponse.json({ error: "Không thể xóa giỏ hàng" }, { status: 500 })
  }
}

