import type { Prisma } from "@prisma/client"
import { prisma } from "@/services/prisma"
import {
  validatePagination,
  buildPagination,
  type ResourcePagination,
  applyColumnOptionsStatusFilter,
  applyColumnOptionsSearchFilter,
  mapToColumnOptions,
} from "@/features/admin/resources/server"
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
  updatedAt: Date
  deletedAt: Date | null
}

export type RoleDetail = ListedRole

export interface ListRolesResult {
  data: ListedRole[]
  pagination: ResourcePagination
}

export const listRoles = async (params: ListRolesInput = {}): Promise<ListRolesResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  try {
    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.role.count({ where }),
    ])

    return {
      data: roles.map(mapRoleRecord),
      pagination: buildPagination(page, limit, total),
    }
  } catch (error) {
    console.error("[listRoles] Error:", error)
    return {
      data: [],
      pagination: buildPagination(page, limit, 0),
    }
  }
};

export const getRoleColumnOptions = async (
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> => {
  const where: Prisma.RoleWhereInput = {}

  // Apply status filter (default: active - column options thường chỉ cần active items)
  applyColumnOptionsStatusFilter(where, "active")

  // Apply search filter based on column
  if (search && search.trim()) {
    switch (column) {
      case "name":
        applyColumnOptionsSearchFilter(where, search, "name")
        break
      case "displayName":
        applyColumnOptionsSearchFilter(where, search, "displayName")
        break
      default:
        applyColumnOptionsSearchFilter(where, search, "name")
    }
  }

  // Build select based on column
  let selectField: Prisma.RoleSelect
  switch (column) {
    case "name":
      selectField = { name: true }
      break
    case "displayName":
      selectField = { displayName: true }
      break
    default:
      selectField = { name: true }
  }

  try {
    const results = await prisma.role.findMany({
      where,
      select: selectField,
      orderBy: { [column]: "asc" },
      take: limit,
    })

    // Map results to options format
    return mapToColumnOptions(results, column)
  } catch (error) {
    console.error("[getRoleColumnOptions] Error:", error)
    return []
  }
};

export const getAllPermissionsOptions = async (): Promise<Array<{ label: string; value: string }>> => {
  try {
    const { PERMISSIONS } = await import("@/permissions")
    
    // Map resource names to Vietnamese labels
    const resourceLabels: Record<string, string> = {
      dashboard: "Dashboard",
      users: "Người dùng",
      posts: "Bài viết",
      categories: "Danh mục",
      tags: "Thẻ",
      comments: "Bình luận",
      roles: "Vai trò",
      messages: "Tin nhắn",
      notifications: "Thông báo",
      contact_requests: "Liên hệ",
      students: "sinh viên",
      settings: "Cài đặt",
    }

    // Map action names to Vietnamese labels
    const actionLabels: Record<string, string> = {
      view: "Xem",
      create: "Tạo",
      update: "Cập nhật",
      delete: "Xóa",
      publish: "Xuất bản",
      approve: "Duyệt",
      assign: "Gán",
      manage: "Quản lý",
    }

    // Track unique permission values to avoid duplicates
    const seenValues = new Set<string>()
    
    return Object.entries(PERMISSIONS)
      .map(([_key, value]) => {
        const permissionValue = String(value)
        
        // Skip if we've already seen this permission value
        if (seenValues.has(permissionValue)) {
          return null
        }
        
        const [resource, action] = permissionValue.split(":")
        const resourceLabel = resourceLabels[resource] || resource
        const actionLabel = actionLabels[action] || action
        const label = `${actionLabel} - ${resourceLabel}`
        
        // Mark this permission value as seen
        seenValues.add(permissionValue)
        
        return {
          label,
          value: permissionValue,
        }
      })
      .filter((item): item is { label: string; value: string } => item !== null)
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error("[getAllPermissionsOptions] Error:", error)
    return []
  }
};

export const getRoleById = async (id: string): Promise<RoleDetail | null> => {
  try {
    const role = await prisma.role.findUnique({
      where: { id },
    })

    if (!role) {
      return null
    }

    // mapRoleRecord đã include updatedAt
    return mapRoleRecord(role)
  } catch (error) {
    console.error("[getRoleById] Error:", error)
    return null
  }
};;

// Re-export helpers for convenience
export { mapRoleRecord, type RoleWithRelations } from "./helpers"

