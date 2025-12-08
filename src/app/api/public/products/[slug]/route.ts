/**
 * Public API Route: GET /api/public/products/[slug]
 * 
 * Get product detail by slug
 * 
 * @public - No authentication required
 */
import { NextRequest } from "next/server"
import { getProductBySlug } from "@/features/public/products/server/queries"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)

    if (!product) {
      return createErrorResponse("Sản phẩm không tồn tại", { status: 404 })
    }

    return createSuccessResponse({ data: product })
  } catch (error: unknown) {
    console.error("Error fetching product:", error)
    return createErrorResponse(
      error instanceof Error ? error.message : "Không thể lấy thông tin sản phẩm",
      { status: 500 }
    )
  }
}

