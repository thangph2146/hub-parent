import type { Prisma } from "@prisma/client"
import type { DataTableResult } from "@/components/tables"
import {
  serializeDate,
  applyStatusFilter,
  applySearchFilter,
  applyDateFilter,
  applyStringFilter,
  applyBooleanFilter,
  applyStatusFilterFromFilters,
} from "@/features/admin/resources/server"
import type { ListStudentsInput, ListedStudent, StudentDetail, ListStudentsResult } from "../types"
import type { StudentRow } from "../types"

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: {
    user: {
      select: {
        id: true
        name: true
        email: true
      }
    }
  }
}>

export const mapStudentRecord = (student: StudentWithRelations): ListedStudent => {
  return {
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    studentCode: student.studentCode,
    isActive: student.isActive,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
    deletedAt: student.deletedAt ? student.deletedAt.toISOString() : null,
  }
}

export const buildWhereClause = (params: ListStudentsInput): Prisma.StudentWhereInput => {
  const where: Prisma.StudentWhereInput = {}

  // Xử lý status filter
  // inactive được xử lý riêng vì applyStatusFilter không hỗ trợ "inactive"
  if (params.status === "inactive") {
    // inactive status: chỉ hiển thị students không bị xóa và isActive = false
    where.deletedAt = null
    where.isActive = false
  } else {
    // Apply status filter cho active/deleted/all
    const statusForFilter = params.status === "active" || params.status === "deleted" || params.status === "all" 
      ? params.status 
      : undefined
    applyStatusFilter(where, statusForFilter)
    
    // Xử lý filter theo isActive dựa trên status
    // Nếu status = "active" và không có filter isActive cụ thể, chỉ hiển thị students active
    // Nếu status = "all" hoặc "deleted", không filter theo isActive (trừ khi có filter cụ thể)
    if (params.status === "active" && !params.filters?.isActive) {
      where.isActive = true
    }
  }

  // Filter by userId if not super admin
  if (!params.isSuperAdmin && params.actorId) {
    where.userId = params.actorId
  }

  // Apply search filter
  applySearchFilter(where, params.search, ["name", "email", "studentCode"])

  // Apply custom filters
  if (params.filters) {
    const activeFilters = Object.entries(params.filters).filter(([, value]) => Boolean(value))
    for (const [key, rawValue] of activeFilters) {
      const value = typeof rawValue === "string" ? rawValue.trim() : ""
      if (!value) continue

      switch (key) {
        case "name":
        case "email":
        case "studentCode":
          applyStringFilter(where, key, value)
          break
        case "isActive":
          // Override status-based filter nếu có filter isActive cụ thể
          applyBooleanFilter(where, key, value)
          break
        case "status":
          applyStatusFilterFromFilters(where, value)
          break
        case "createdAt":
        case "deletedAt":
          applyDateFilter(where, key, value)
          break
      }
    }
  }

  return where
}

export const serializeStudentForTable = (student: ListedStudent | { id: string; userId: string | null; name: string | null; email: string | null; studentCode: string; isActive: boolean; createdAt: Date | string; deletedAt: Date | string | null }): StudentRow => {
  return {
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    studentCode: student.studentCode,
    isActive: student.isActive,
    createdAt: serializeDate(student.createdAt)!,
    deletedAt: serializeDate(student.deletedAt),
  }
}

export const serializeStudentsList = (data: ListStudentsResult): DataTableResult<StudentRow> => {
  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
    rows: data.rows.map(serializeStudentForTable),
  }
}

export const serializeStudentDetail = (student: StudentDetail) => {
  return {
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    studentCode: student.studentCode,
    isActive: student.isActive,
    createdAt: serializeDate(student.createdAt)!,
    updatedAt: serializeDate(student.updatedAt)!,
    deletedAt: serializeDate(student.deletedAt),
    userName: student.userName,
    userEmail: student.userEmail,
  }
}

export type { StudentWithRelations }

/**
 * Validate và lấy studentCode từ studentId
 * Sử dụng trong các API routes để đảm bảo student tồn tại và có studentCode
 */
export const validateStudentAndGetCode = async (
  studentId: string,
  actorId: string | undefined,
  isSuperAdminUser: boolean
) => {
  const { getStudentById } = await import("./queries")
  const student = await getStudentById(studentId, actorId, isSuperAdminUser)

  if (!student) {
    return { error: { status: 404, message: "Student not found" } } as const
  }

  if (!student.studentCode) {
    return { error: { status: 404, message: "Student code not found" } } as const
  }

  return { student, studentCode: student.studentCode } as const
}

