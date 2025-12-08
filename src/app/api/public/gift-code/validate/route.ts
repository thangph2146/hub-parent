/**
 * Public API Route: POST /api/public/gift-code/validate
 * 
 * Validate gift code and calculate discount
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/database"
import { z } from "zod"
import { logger } from "@/lib/config"

const validateGiftCodeSchema = z.object({
  code: z.string().min(1, "Mã giảm giá là bắt buộc"),
  subtotal: z.number().min(0, "Tổng tiền phải lớn hơn 0"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = validateGiftCodeSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { success: false, message: firstError?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      )
    }

    const { code, subtotal } = validationResult.data

    // Find gift code
    const giftCode = await prisma.giftCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (!giftCode) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá không tồn tại" },
        { status: 404 }
      )
    }

    // Check if gift code is active
    if (!giftCode.isActive) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá đã bị vô hiệu hóa" },
        { status: 400 }
      )
    }

    // Check if gift code is expired
    const now = new Date()
    if (giftCode.validUntil && new Date(giftCode.validUntil) < now) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá đã hết hạn" },
        { status: 400 }
      )
    }

    // Check if gift code is not yet valid
    if (new Date(giftCode.validFrom) > now) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá chưa có hiệu lực" },
        { status: 400 }
      )
    }

    // Check usage limit
    if (giftCode.usageLimit && giftCode.usedCount >= giftCode.usageLimit) {
      return NextResponse.json(
        { success: false, message: "Mã giảm giá đã hết lượt sử dụng" },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (giftCode.minOrderAmount && subtotal < parseFloat(giftCode.minOrderAmount.toString())) {
      return NextResponse.json(
        {
          success: false,
          message: `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(parseFloat(giftCode.minOrderAmount.toString()))} để sử dụng mã này`,
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = 0
    if (giftCode.discountType === "PERCENTAGE") {
      discount = (subtotal * parseFloat(giftCode.discountValue.toString())) / 100
      // Apply max discount if set
      if (giftCode.maxDiscount) {
        discount = Math.min(discount, parseFloat(giftCode.maxDiscount.toString()))
      }
    } else {
      // FIXED_AMOUNT
      discount = parseFloat(giftCode.discountValue.toString())
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal)

    return NextResponse.json({
      success: true,
      data: {
        code: giftCode.code,
        discountType: giftCode.discountType,
        discountValue: parseFloat(giftCode.discountValue.toString()),
        discount: Math.round(discount),
        description: giftCode.description,
      },
    })
  } catch (error) {
    logger.error("[POST /api/public/gift-code/validate] Error:", { error })
    return NextResponse.json(
      {
        success: false,
        message: "Không thể xác thực mã giảm giá. Vui lòng thử lại sau.",
      },
      { status: 500 }
    )
  }
}

