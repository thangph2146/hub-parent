import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction, isSuperAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { mapStudentRecord, type StudentWithRelations } from "./helpers"
import type { ListedStudent } from "../types"
import type { BulkActionResult } from "../types"
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  BulkStudentActionSchema,
} from "./schemas"
import { notifySuperAdminsOfStudentAction } from "./notifications"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  type AuthContext,
} from "@/features/admin/resources/server"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

function sanitizeStudent(student: StudentWithRelations): ListedStudent {
  return mapStudentRecord(student)
}

export async function createStudent(ctx: AuthContext, input: unknown): Promise<ListedStudent> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_CREATE, PERMISSIONS.STUDENTS_MANAGE)

  // Validate input với zod
  const validationResult = CreateStudentSchema.safeParse(input)
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]
    throw new ApplicationError(firstError?.message || "Dữ liệu không hợp lệ", 400)
  }

  const validatedInput = validationResult.data

  const trimmedStudentCode = validatedInput.studentCode.trim()

  // Check if studentCode already exists
  const existing = await prisma.student.findFirst({
    where: {
      studentCode: trimmedStudentCode,
      deletedAt: null,
    },
  })

  if (existing) {
    throw new ApplicationError("Mã học sinh đã tồn tại", 400)
  }

  // Check permission: non-super admin can only create students with their userId
  const isSuperAdminUser = isSuperAdmin(ctx.roles)
  let finalUserId: string | null = validatedInput.userId || null

  // Nếu không phải super admin, tự động set userId = actorId
  if (!isSuperAdminUser) {
    finalUserId = ctx.actorId
  }

  // Nếu super admin cố gắng set userId nhưng không phải super admin, reject
  if (!isSuperAdminUser && validatedInput.userId && validatedInput.userId !== ctx.actorId) {
    throw new ForbiddenError("Bạn không có quyền liên kết học sinh với tài khoản khác")
  }

  const student = await prisma.student.create({
    data: {
      studentCode: trimmedStudentCode,
      name: validatedInput.name?.trim() || null,
      email: validatedInput.email?.trim() || null,
      userId: finalUserId,
      isActive: validatedInput.isActive ?? true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const sanitized = sanitizeStudent(student)

  // Emit notification realtime
  await notifySuperAdminsOfStudentAction(
    "create",
    ctx.actorId,
    {
      id: sanitized.id,
      studentCode: sanitized.studentCode,
      name: sanitized.name,
    }
  )

  return sanitized
}

export async function updateStudent(ctx: AuthContext, id: string, input: unknown): Promise<ListedStudent> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_UPDATE, PERMISSIONS.STUDENTS_MANAGE)

  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID học sinh không hợp lệ", 400)
  }

  // Validate input với zod
  const validationResult = UpdateStudentSchema.safeParse(input)
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]
    throw new ApplicationError(firstError?.message || "Dữ liệu không hợp lệ", 400)
  }

  const validatedInput = validationResult.data

  const existing = await prisma.student.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Học sinh không tồn tại")
  }

  // Check permission: non-super admin can only update students with their userId
  const isSuperAdminUser = isSuperAdmin(ctx.roles)
  if (!isSuperAdminUser && existing.userId !== ctx.actorId) {
    throw new ForbiddenError("Bạn chỉ có thể cập nhật học sinh của chính mình")
  }

  // Nếu không phải super admin, không cho phép thay đổi userId
  if (!isSuperAdminUser && validatedInput.userId !== undefined && validatedInput.userId !== existing.userId) {
    throw new ForbiddenError("Bạn không có quyền thay đổi liên kết tài khoản")
  }

  // Track changes for notification
  const changes: {
    studentCode?: { old: string; new: string }
    name?: { old: string | null; new: string | null }
    email?: { old: string | null; new: string | null }
    isActive?: { old: boolean; new: boolean }
  } = {}

  const updateData: Prisma.StudentUpdateInput = {}

  if (validatedInput.studentCode !== undefined) {
    const trimmedStudentCode = validatedInput.studentCode.trim()
    // Check if studentCode is already used by another student
    if (trimmedStudentCode !== existing.studentCode) {
      const codeExists = await prisma.student.findFirst({
        where: {
          studentCode: trimmedStudentCode,
          deletedAt: null,
          id: { not: id },
        },
      })
      if (codeExists) {
        throw new ApplicationError("Mã học sinh đã được sử dụng", 400)
      }
      changes.studentCode = { old: existing.studentCode, new: trimmedStudentCode }
    }
    updateData.studentCode = trimmedStudentCode
  }

  if (validatedInput.name !== undefined) {
    const trimmedName = validatedInput.name?.trim() || null
    if (trimmedName !== existing.name) {
      changes.name = { old: existing.name, new: trimmedName }
    }
    updateData.name = trimmedName
  }

  if (validatedInput.email !== undefined) {
    const trimmedEmail = validatedInput.email?.trim() || null
    if (trimmedEmail !== existing.email) {
      changes.email = { old: existing.email, new: trimmedEmail }
    }
    updateData.email = trimmedEmail
  }

  if (validatedInput.userId !== undefined) {
    if (validatedInput.userId) {
      updateData.user = { connect: { id: validatedInput.userId } }
    } else {
      updateData.user = { disconnect: true }
    }
  }

  if (validatedInput.isActive !== undefined) {
    if (validatedInput.isActive !== existing.isActive) {
      changes.isActive = { old: existing.isActive, new: validatedInput.isActive }
    }
    updateData.isActive = validatedInput.isActive
  }

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const sanitized = sanitizeStudent(student)

  // Emit notification realtime
  await notifySuperAdminsOfStudentAction(
    "update",
    ctx.actorId,
    {
      id: sanitized.id,
      studentCode: sanitized.studentCode,
      name: sanitized.name,
    },
    Object.keys(changes).length > 0 ? changes : undefined
  )

  return sanitized
}

export async function softDeleteStudent(ctx: AuthContext, id: string): Promise<void> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_DELETE, PERMISSIONS.STUDENTS_MANAGE)

  const student = await prisma.student.findUnique({ where: { id } })
  if (!student || student.deletedAt) {
    throw new NotFoundError("Học sinh không tồn tại")
  }

  // Check permission: non-super admin can only delete students with their userId
  const isSuperAdminUser = isSuperAdmin(ctx.roles)
  if (!isSuperAdminUser && student.userId !== ctx.actorId) {
    throw new ForbiddenError("Bạn chỉ có thể xóa học sinh của chính mình")
  }

  await prisma.student.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  // Emit notification realtime
  await notifySuperAdminsOfStudentAction(
    "delete",
    ctx.actorId,
    {
      id: student.id,
      studentCode: student.studentCode,
      name: student.name,
    }
  )
}

export async function bulkSoftDeleteStudents(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_DELETE, PERMISSIONS.STUDENTS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách học sinh trống", 400)
  }

  // Lấy thông tin students trước khi delete để tạo notifications
  const students = await prisma.student.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, studentCode: true, name: true },
  })

  const result = await prisma.student.updateMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  })

  // Emit notifications realtime cho từng student
  for (const student of students) {
    await notifySuperAdminsOfStudentAction(
      "delete",
      ctx.actorId,
      student
    )
  }

  return { success: true, message: `Đã xóa ${result.count} học sinh`, affectedCount: result.count }
}

export async function restoreStudent(ctx: AuthContext, id: string): Promise<void> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_UPDATE, PERMISSIONS.STUDENTS_MANAGE)

  const student = await prisma.student.findUnique({ where: { id } })
  if (!student || !student.deletedAt) {
    throw new NotFoundError("Học sinh không tồn tại hoặc chưa bị xóa")
  }

  await prisma.student.update({
    where: { id },
    data: {
      deletedAt: null,
    },
  })

  // Emit notification realtime
  await notifySuperAdminsOfStudentAction(
    "restore",
    ctx.actorId,
    {
      id: student.id,
      studentCode: student.studentCode,
      name: student.name,
    }
  )
}

export async function bulkRestoreStudents(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  ensurePermission(ctx, PERMISSIONS.STUDENTS_UPDATE, PERMISSIONS.STUDENTS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách học sinh trống", 400)
  }

  // Lấy thông tin students trước khi restore để tạo notifications
  const students = await prisma.student.findMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    select: { id: true, studentCode: true, name: true },
  })

  const result = await prisma.student.updateMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
    },
  })

  // Emit notifications realtime cho từng student
  for (const student of students) {
    await notifySuperAdminsOfStudentAction(
      "restore",
      ctx.actorId,
      student
    )
  }

  return { success: true, message: `Đã khôi phục ${result.count} học sinh`, affectedCount: result.count }
}

export async function hardDeleteStudent(ctx: AuthContext, id: string): Promise<void> {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.STUDENTS_MANAGE])) {
    throw new ForbiddenError()
  }

  const student = await prisma.student.findUnique({
    where: { id },
    select: { id: true, studentCode: true, name: true },
  })

  if (!student) {
    throw new NotFoundError("Học sinh không tồn tại")
  }

  await prisma.student.delete({
    where: { id },
  })

  // Emit notification realtime
  await notifySuperAdminsOfStudentAction(
    "hard-delete",
    ctx.actorId,
    student
  )
}

export async function bulkHardDeleteStudents(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.STUDENTS_MANAGE])) {
    throw new ForbiddenError()
  }

  // Validate với Zod
  const validationResult = BulkStudentActionSchema.safeParse({ action: "hard-delete", ids })
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0]
    throw new ApplicationError(firstError?.message || "Dữ liệu không hợp lệ", 400)
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách học sinh trống", 400)
  }

  // Lấy thông tin students trước khi delete để tạo notifications
  const students = await prisma.student.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, studentCode: true, name: true },
  })

  const result = await prisma.student.deleteMany({
    where: {
      id: { in: ids },
    },
  })

  // Emit notifications realtime cho từng student
  for (const student of students) {
    await notifySuperAdminsOfStudentAction(
      "hard-delete",
      ctx.actorId,
      student
    )
  }

  return { success: true, message: `Đã xóa vĩnh viễn ${result.count} học sinh`, affectedCount: result.count }
}

