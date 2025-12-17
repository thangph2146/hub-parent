/**
 * API Route: GET /api/students/[id]/averages/terms
 * Lấy danh sách điểm trung bình tích lũy theo học kỳ từ external API
 * Yêu cầu: Đăng nhập và có permission "students:view"
 */

import { NextRequest, NextResponse } from "next/server"
import { createGetRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { isSuperAdmin } from "@/lib/permissions"
import { callExternalApi } from "@/lib/api/external-api-client"
import type { StudentTermAveragesResponse } from "@/lib/api/types/student-scores"
import { validateStudentAndGetCode } from "@/features/admin/students/server/helpers"
import { logger } from "@/lib/config"

const getStudentTermAveragesHandler = async (
  _req: NextRequest,
  context: ApiRouteContext,
  ...args: unknown[]
): Promise<NextResponse> => {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: studentId } = await params

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
  }

  try {
    // Validate student và lấy studentCode
    const actorId = context.session.user?.id
    const isSuperAdminUser = isSuperAdmin(context.roles)
    const validation = await validateStudentAndGetCode(studentId, actorId, isSuperAdminUser)

    if (validation.error) {
      return NextResponse.json({ error: validation.error.message }, { status: validation.error.status })
    }

    // Gọi external API
    const endpoint = `/api/Averages/terms/${validation.studentCode}`
    const data = await callExternalApi<StudentTermAveragesResponse>(endpoint)

    return NextResponse.json({ data })
  } catch (error) {
    logger.error("[Student Averages API] Error fetching term averages", {
      studentId,
      userId: context.session.user?.id,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        error: "Không thể lấy dữ liệu điểm trung bình tích lũy theo học kỳ",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Yêu cầu đăng nhập và permission "students:view"
export const GET = createGetRoute(getStudentTermAveragesHandler, {
  permissions: "students:view",
  requireAuth: true,
})

