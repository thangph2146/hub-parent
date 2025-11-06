/**
 * Non-cached Database Queries for Students
 * 
 * Chứa các database queries không có cache wrapper
 * Sử dụng cho các trường hợp cần fresh data hoặc trong API routes
 */

import { prisma } from "@/lib/database"
import { validatePagination } from "@/features/admin/resources/server"
import { mapStudentRecord, buildWhereClause } from "./helpers"
import type { ListStudentsInput, StudentDetail, ListStudentsResult } from "../types"

export async function listStudents(params: ListStudentsInput = {}): Promise<ListStudentsResult> {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.student.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    rows: data.map(mapStudentRecord),
    total,
    page,
    limit,
    totalPages,
  }
}

export async function getStudentById(id: string): Promise<StudentDetail | null> {
  const student = await prisma.student.findUnique({
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

  if (!student) {
    return null
  }

  return {
    ...mapStudentRecord(student),
    userName: student.user?.name || null,
    userEmail: student.user?.email || null,
  }
}

