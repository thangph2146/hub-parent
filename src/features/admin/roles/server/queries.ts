/**
 * Non-cached Database Queries for Roles
 * 
 * Chứa các database queries không có cache wrapper
 * Sử dụng cho các trường hợp cần fresh data hoặc trong API routes
 */

import { prisma } from "@/lib/database"
import { validatePagination, buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import { mapRoleRecord, buildWhereClause } from "./helpers"

export interface ListRolesInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface ListedRole {
  id: string
  name: string
  displayName: string
  description: string | null
  permissions: string[]
  isActive: boolean
  createdAt: Date
  deletedAt: Date | null
}

export interface RoleDetail extends ListedRole {
  updatedAt: Date
}

export interface ListRolesResult {
  data: ListedRole[]
  pagination: ResourcePagination
}

export async function listRoles(params: ListRolesInput = {}): Promise<ListRolesResult> {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.count({ where }),
  ])

  return {
    data: roles.map(mapRoleRecord),
    pagination: buildPagination(page, limit, total),
  }
}

export async function getRoleById(id: string): Promise<ListedRole | null> {
  const role = await prisma.role.findUnique({
    where: { id },
  })

  if (!role) {
    return null
  }

  return mapRoleRecord(role)
}

// Re-export helpers for convenience
export { mapRoleRecord, type RoleWithRelations } from "./helpers"

