/**
 * API Route: GET /api/admin/students/[id] - Get student
 * PUT /api/admin/students/[id] - Update student
 * DELETE /api/admin/students/[id] - Soft delete student
 */
import { NextRequest } from "next/server"
import { getStudentById } from "@/features/admin/students/server/queries"
import { serializeStudentDetail } from "@/features/admin/students/server/helpers"
import {
  updateStudent,
  softDeleteStudent,
  type AuthContext,
} from "@/features/admin/students/server/mutations"
import { UpdateStudentSchema } from "@/features/admin/students/server/schemas"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib"
import type { ApiRouteContext } from "@/types"
import { isSuperAdmin } from "@/permissions"
import { validateID } from "@/utils"
import { extractParams, parseRequestBody, createAuthContext, handleApiError } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"

async function getStudentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: studentId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(studentId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Student ID không hợp lệ", { status: 400 })
    }

    // Check if user is super admin
    const actorId = context.session.user?.id
    const isSuperAdminUser = isSuperAdmin(context.roles)

    // Sử dụng getStudentById (non-cached) để đảm bảo data luôn fresh
    // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
    const student = await getStudentById(studentId, actorId, isSuperAdminUser)

    if (!student) {
      return createErrorResponse("Student not found", { status: 404 })
    }

    return createSuccessResponse(serializeStudentDetail(student))
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi lấy thông tin sinh viên", 500)
  }
}

async function putStudentHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: studentId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(studentId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Student ID không hợp lệ", { status: 400 })
    }

    const body = await parseRequestBody(req)

    // Validate body với Zod schema
    const validationResult = UpdateStudentSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return createErrorResponse(firstError?.message || "Dữ liệu không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    const student = await updateStudent(ctx, studentId, validationResult.data)
    // mapStudentRecord đã serialize dates to ISO strings, sử dụng trực tiếp
    return createSuccessResponse(student)
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi cập nhật sinh viên", 500)
  }
}

async function deleteStudentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  try {
    const { id: studentId } = await extractParams<{ id: string }>(args)

    const idValidation = validateID(studentId)
    if (!idValidation.valid) {
      return createErrorResponse(idValidation.error || "Student ID không hợp lệ", { status: 400 })
    }

    const userId = context.session.user?.id ?? "unknown"
    const ctx = createAuthContext(context, userId) as AuthContext

    await softDeleteStudent(ctx, studentId)
    return createSuccessResponse({ message: "Student deleted successfully" })
  } catch (error) {
    return handleApiError(error, "Đã xảy ra lỗi khi xóa sinh viên", 500)
  }
}

export const GET = createGetRoute(getStudentHandler)
export const PUT = createPutRoute(putStudentHandler)
export const DELETE = createDeleteRoute(deleteStudentHandler)

