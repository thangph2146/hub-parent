/**
 * API Route: GET /api/admin/users/search - Search users for new conversation
 * 
 * Theo Next.js 16 best practices:
 * - Sử dụng createApiRoute wrapper để handle authentication và permissions
 * - Validate input và return proper error responses
 * - Support query param: q (search query)
 */

import { NextRequest } from "next/server"
import { createApiRoute } from "@/lib/api/api-route-wrapper"
import { prisma } from "@/lib/prisma"
import type { ApiRouteContext } from "@/lib/api/types"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"

async function searchUsersHandler(req: NextRequest, context: ApiRouteContext) {
  if (!context.session?.user?.id) {
    return createErrorResponse("Unauthorized", { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const query = searchParams.get("q") || ""

  // Nếu không có query hoặc query < 2 ký tự, trả về danh sách người dùng mặc định
  if (!query || query.length < 2) {
    const defaultUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        // Exclude current user
        id: { not: context.session.user.id },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
      take: 20,
      orderBy: { name: "asc" },
    })
    return createSuccessResponse(defaultUsers)
  }

  // Nếu có query, tìm kiếm theo query
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
    take: 20,
    orderBy: { name: "asc" },
  })

  return createSuccessResponse(users)
}

export const GET = createApiRoute(searchUsersHandler)

