/**
 * API Route: GET /api/students/[id]/scores/detailed
 * Lấy danh sách điểm chi tiết theo MSSV từ external API
 * Yêu cầu: Đăng nhập và có permission "students:view"
 */

import { NextRequest } from "next/server"
import { createGetRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { isSuperAdmin } from "@/permissions"
import { callExternalApi } from "@/services/api/external-api-client"
import type { StudentScoresResponse } from "@/types"
import { validateStudentAndGetCode } from "@/features/admin/students/server/helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib"
import { logger } from "@/utils"

const getStudentDetailedScoresHandler = async (
  _req: NextRequest,
  context: ApiRouteContext,
  ...args: unknown[]
) => {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: studentId } = await params

  if (!studentId) {
    return createErrorResponse("Student ID is required", { status: 400 })
  }

  try {
    // Validate student và lấy studentCode
    const actorId = context.session.user?.id
    const isSuperAdminUser = isSuperAdmin(context.roles)
    const permissions = context.permissions || []
    const validation = await validateStudentAndGetCode(studentId, actorId, isSuperAdminUser, permissions)

    if (validation.error) {
      return createErrorResponse(validation.error.message, { status: validation.error.status })
    }

    // Gọi external API
    const endpoint = `/api/Scores/detailed/${validation.studentCode}`
    const data = await callExternalApi<StudentScoresResponse>(endpoint)

    return createSuccessResponse(data)
  } catch (error) {
    logger.error("[Student Scores API] Error fetching detailed scores", {
      studentId,
      userId: context.session.user?.id,
      error: error instanceof Error ? error.message : String(error),
    })

    return createErrorResponse(
      "Không thể lấy dữ liệu điểm chi tiết",
      { 
        status: 500,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    )
  }
}

// Yêu cầu đăng nhập và permission "students:view"
export const GET = createGetRoute(getStudentDetailedScoresHandler, {
  permissions: "students:view",
  requireAuth: true,
})

