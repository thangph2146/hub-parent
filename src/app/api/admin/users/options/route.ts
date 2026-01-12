/**
 * API Route: GET /api/admin/users/options - Get filter options for a column
 * 
 * Theo chuẩn Next.js 16:
 * - Sử dụng server-side caching với React cache()
 * - Response caching với short-term cache (30s) để optimize performance
 * - Dynamic route vì có search query parameter
 */
import { NextRequest } from "next/server"
import { getUserColumnOptions } from "@/features/admin/users/server/queries"
import { createGetRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { createOptionsHandler } from "@/lib"

async function getUserOptionsHandler(req: NextRequest, _context: ApiRouteContext) {
  return createOptionsHandler(req, {
    allowedColumns: ["email", "name"],
    getOptions: (column, search, limit) => getUserColumnOptions(column, search, limit),
  })
}

// Route Segment Config theo Next.js 16
// LƯU Ý: Phải là static values, không thể từ object (Next.js requirement)
export const dynamic = "force-dynamic"
export const revalidate = false

export const GET = createGetRoute(getUserOptionsHandler)

