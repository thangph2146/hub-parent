/**
 * Public API Route: GET /api/public/products
 * 
 * List active products with pagination, filtering, and sorting
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 12, max: 100)
 * - search: string (optional)
 * - category: string (optional, category slug)
 * - featured: boolean (optional)
 * - sortBy: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "created_desc" (default: "created_desc")
 * 
 * @public - No authentication required
 */
import { NextRequest } from "next/server"
import { getProducts } from "@/features/public/products/server/queries"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 100)
    const search = searchParams.get("search") || undefined
    const category = searchParams.get("category") || undefined
    const featured = searchParams.get("featured") === "true" ? true : searchParams.get("featured") === "false" ? false : undefined
    const sortBy = (searchParams.get("sortBy") || "created_desc") as
      | "price_asc"
      | "price_desc"
      | "name_asc"
      | "name_desc"
      | "created_desc"

    if (page < 1) {
      return createErrorResponse("Page must be greater than 0", { status: 400 })
    }

    if (limit < 1 || limit > 100) {
      return createErrorResponse("Limit must be between 1 and 100", { status: 400 })
    }

    const result = await getProducts({
      page,
      limit,
      search,
      category,
      featured,
      sortBy,
    })

    return createSuccessResponse({
      data: result.products,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasMore: result.page < result.totalPages,
      },
    })
  } catch (error: unknown) {
    console.error("Error fetching products:", error)
    return createErrorResponse(
      error instanceof Error ? error.message : "Không thể lấy danh sách sản phẩm",
      { status: 500 }
    )
  }
}

