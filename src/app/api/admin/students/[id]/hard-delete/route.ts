/**
 * API Route: DELETE /api/admin/students/[id]/hard-delete - Hard delete student
 */
import { NextRequest } from "next/server"
import {
  hardDeleteStudent,
  type AuthContext,
} from "@/features/admin/students/server/mutations"
import { createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { validateID } from "@/lib/api/validation"
import { extractParams, createAuthContext, handleApiError } from "@/lib/api/api-route-helpers"
import { createErrorResponse, createSuccessResponse } from "@/lib/config"

async function hardDeleteStudentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: studentId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(studentId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Student ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await hardDeleteStudent(ctx, studentId)
    return createSuccessResponse({ message: "Student permanently deleted" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa vĩnh viễn sinh viên", 500)
  }
}

export const DELETE = createDeleteRoute(hardDeleteStudentHandler)

