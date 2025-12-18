import type { Prisma } from "@prisma/client"
import {
  serializeDate,
  applyStatusFilter,
  applySearchFilter,
  applyDateFilter,
  applyStringFilter,
  applyBooleanFilter,
  applyStatusFilterFromFilters,
  createSerializeList,
} from "@/features/admin/resources/server"
import type { ListRolesInput, ListedRole, RoleDetail } from "./queries"
import type { RoleRow } from "../types"

type RoleWithRelations = Prisma.RoleGetPayload<Record<string, never>>

export const mapRoleRecord = (role: RoleWithRelations): ListedRole => {
  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    permissions: role.permissions,
    isActive: role.isActive,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    deletedAt: role.deletedAt,
  }
}

export const buildWhereClause = (params: ListRolesInput): Prisma.RoleWhereInput => {
  const where: Prisma.RoleWhereInput = {}

  // Apply status filter
  applyStatusFilter(where, params.status)

  // Apply search filter
  applySearchFilter(where, params.search, ["name", "displayName", "description"])

  // Apply custom filters
  if (params.filters) {
    const activeFilters = Object.entries(params.filters).filter(([, value]) => Boolean(value))
    for (const [key, rawValue] of activeFilters) {
      const value = rawValue?.trim()
      if (!value) continue

      switch (key) {
        case "name":
        case "displayName":
          applyStringFilter(where, key, value)
          break
        case "isActive":
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

export const serializeRoleForTable = (role: ListedRole | { id: string; name: string; displayName: string; description: string | null; permissions: string[]; isActive: boolean; createdAt: Date | string; updatedAt?: Date | string; deletedAt: Date | string | null }): RoleRow => {
  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    permissions: role.permissions,
    isActive: role.isActive,
    createdAt: serializeDate(role.createdAt)!,
    updatedAt: role.updatedAt ? (serializeDate(role.updatedAt) ?? undefined) : undefined, // Thêm updatedAt để so sánh cache chính xác (convert null to undefined)
    deletedAt: serializeDate(role.deletedAt),
  }
}

export const serializeRolesList = createSerializeList(serializeRoleForTable)

export const serializeRoleDetail = (role: RoleDetail) => {
  return {
    id: role.id,
    name: role.name,
    displayName: role.displayName,
    description: role.description,
    permissions: role.permissions,
    isActive: role.isActive,
    createdAt: serializeDate(role.createdAt)!,
    updatedAt: serializeDate(role.updatedAt)!,
    deletedAt: serializeDate(role.deletedAt),
  }
}

export type { RoleWithRelations }

