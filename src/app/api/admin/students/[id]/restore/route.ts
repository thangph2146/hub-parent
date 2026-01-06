/**
 * API Route: POST /api/admin/students/[id]/restore - Restore student
 */
import { NextRequest, NextResponse } from "next/server"
import {
  restoreStudent,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/students/server/mutations"
import { createPostRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { logger } from "@/lib/config/logger"

async function restoreStudentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: studentId } = await params

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    await restoreStudent(ctx, studentId)
    return NextResponse.json({ message: "Student restored successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể khôi phục sinh viên" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    logger.error("Error restoring student", { error, studentId })
    return NextResponse.json({ error: "Đã xảy ra lỗi khi khôi phục sinh viên" }, { status: 500 })
  }
}

export const POST = createPostRoute(restoreStudentHandler)

