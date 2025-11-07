/**
 * Helper Functions for Students Server Logic
 * 
 * Chứa các helper functions được dùng chung bởi queries, cache, và mutations
 */

import type { Prisma } from "@prisma/client"
import type { DataTableResult } from "@/components/tables"
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

/**
 * Map Prisma student record to ListedStudent format
 */
export function mapStudentRecord(student: StudentWithRelations): ListedStudent {
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

/**
 * Build Prisma where clause from ListStudentsInput
 */
export function buildWhereClause(params: ListStudentsInput): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {}
  const status = params.status ?? "active"

  if (status === "active") {
    where.deletedAt = null
  } else if (status === "deleted") {
    where.deletedAt = { not: null }
  }

  // Filter by userId if not super admin
  if (!params.isSuperAdmin && params.actorId) {
    where.userId = params.actorId
  }

  if (params.search) {
    const searchValue = params.search.trim()
    if (searchValue.length > 0) {
      where.OR = [
        { name: { contains: searchValue, mode: "insensitive" } },
        { email: { contains: searchValue, mode: "insensitive" } },
        { studentCode: { contains: searchValue, mode: "insensitive" } },
      ]
    }
  }

  if (params.filters) {
    const activeFilters = Object.entries(params.filters).filter(([, value]) => Boolean(value))
    for (const [key, rawValue] of activeFilters) {
      const value = typeof rawValue === "string" ? rawValue.trim() : ""
      if (!value) continue

      switch (key) {
        case "name":
          where.name = { contains: value, mode: "insensitive" }
          break
        case "email":
          where.email = { contains: value, mode: "insensitive" }
          break
        case "studentCode":
          where.studentCode = { contains: value, mode: "insensitive" }
          break
        case "isActive":
          if (value === "true") where.isActive = true
          else if (value === "false") where.isActive = false
          break
        case "status":
          if (value === "deleted") where.deletedAt = { not: null }
          else if (value === "active") where.deletedAt = null
          break
        case "createdAt":
        case "deletedAt":
          try {
            const filterDate = new Date(value)
            if (!isNaN(filterDate.getTime())) {
              const startOfDay = new Date(filterDate)
              startOfDay.setHours(0, 0, 0, 0)
              const endOfDay = new Date(filterDate)
              endOfDay.setHours(23, 59, 59, 999)
              where[key === "createdAt" ? "createdAt" : "deletedAt"] = {
                gte: startOfDay,
                lte: endOfDay,
              }
            }
          } catch {
            // Invalid date format, skip filter
          }
          break
      }
    }
  }

  return where
}

/**
 * Serialize student data for DataTable format
 */
export function serializeStudentForTable(student: ListedStudent): StudentRow {
  return {
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    studentCode: student.studentCode,
    isActive: student.isActive,
    createdAt: student.createdAt,
    deletedAt: student.deletedAt,
  }
}

/**
 * Serialize ListStudentsResult to DataTable format
 */
export function serializeStudentsList(data: ListStudentsResult): DataTableResult<StudentRow> {
  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
    rows: data.rows.map(serializeStudentForTable),
  }
}

/**
 * Serialize StudentDetail to client format
 */
export function serializeStudentDetail(student: StudentDetail) {
  return {
    id: student.id,
    userId: student.userId,
    name: student.name,
    email: student.email,
    studentCode: student.studentCode,
    isActive: student.isActive,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    deletedAt: student.deletedAt,
    userName: student.userName,
    userEmail: student.userEmail,
  }
}

export type { StudentWithRelations }

