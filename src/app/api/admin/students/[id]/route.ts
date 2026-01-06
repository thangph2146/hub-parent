/**
 * API Route: GET /api/admin/students/[id] - Get student
 * PUT /api/admin/students/[id] - Update student
 * DELETE /api/admin/students/[id] - Soft delete student
 */
import { NextRequest, NextResponse } from "next/server"
import { getStudentById } from "@/features/admin/students/server/queries"
import { serializeStudentDetail } from "@/features/admin/students/server/helpers"
import {
  updateStudent,
  softDeleteStudent,
  type AuthContext,
  ApplicationError,
  NotFoundError,
} from "@/features/admin/students/server/mutations"
import { UpdateStudentSchema } from "@/features/admin/students/server/schemas"
import { createGetRoute, createPutRoute, createDeleteRoute } from "@/lib/api/api-route-wrapper"
import type { ApiRouteContext } from "@/lib/api/types"
import { isSuperAdmin } from "@/lib/permissions"
import { logger } from "@/lib/config/logger"

async function getStudentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: studentId } = await params

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
  }

  // Check if user is super admin
  const actorId = context.session.user?.id
  const isSuperAdminUser = isSuperAdmin(context.roles)

  // Sử dụng getStudentById (non-cached) để đảm bảo data luôn fresh
  // API routes cần fresh data, không nên sử dụng cache để tránh trả về dữ liệu cũ
  const student = await getStudentById(studentId, actorId, isSuperAdminUser)

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  return NextResponse.json({ data: serializeStudentDetail(student) })
}

async function putStudentHandler(req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
  const { params } = args[0] as { params: Promise<{ id: string }> }
  const { id: studentId } = await params

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." }, { status: 400 })
  }

  // Validate body với Zod schema
  const validationResult = UpdateStudentSchema.safeParse(body)
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]
    return NextResponse.json({ error: firstError?.message || "Dữ liệu không hợp lệ" }, { status: 400 })
  }

  const ctx: AuthContext = {
    actorId: context.session.user?.id ?? "unknown",
    permissions: context.permissions,
    roles: context.roles,
  }

  try {
    const student = await updateStudent(ctx, studentId, validationResult.data)
    // mapStudentRecord đã serialize dates to ISO strings, sử dụng trực tiếp
    return NextResponse.json({ data: student })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể cập nhật sinh viên" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    logger.error("Error updating student", { error, studentId })
    return NextResponse.json({ error: "Đã xảy ra lỗi khi cập nhật sinh viên" }, { status: 500 })
  }
}

async function deleteStudentHandler(_req: NextRequest, context: ApiRouteContext, ...args: unknown[]) {
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
    await softDeleteStudent(ctx, studentId)
    return NextResponse.json({ message: "Student deleted successfully" })
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: error.message || "Không thể xóa sinh viên" }, { status: error.status || 400 })
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message || "Không tìm thấy" }, { status: 404 })
    }
    logger.error("Error deleting student", { error, studentId })
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa sinh viên" }, { status: 500 })
  }
}

export const GET = createGetRoute(getStudentHandler)
export const PUT = createPutRoute(putStudentHandler)
export const DELETE = createDeleteRoute(deleteStudentHandler)

