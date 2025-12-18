import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/database"
import { validatePagination, buildPagination, type ResourcePagination } from "@/features/admin/resources/server"
import {
  applyColumnOptionsStatusFilter,
  applyColumnOptionsSearchFilter,
  mapToColumnOptions,
} from "@/features/admin/resources/server"
import { mapUserRecord, buildWhereClause } from "./helpers"

export interface ListUsersInput {
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
  status?: "active" | "deleted" | "all"
}

export interface ListedUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  isActive: boolean
  createdAt: Date
  deletedAt: Date | null
  roles: Array<{
    id: string
    name: string
    displayName: string
  }>
}

export interface UserDetail extends ListedUser {
  bio: string | null
  phone: string | null
  address: string | null
  emailVerified: Date | null
  updatedAt: Date
}

export interface ListUsersResult {
  data: ListedUser[]
  pagination: ResourcePagination
}

export const listUsers = async (params: ListUsersInput = {}): Promise<ListUsersResult> => {
  const { page, limit } = validatePagination(params.page, params.limit, 100)
  const where = buildWhereClause(params)

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    data: users.map(mapUserRecord),
    pagination: buildPagination(page, limit, total),
  }
};

export const getUserColumnOptions = async (
  column: string,
  search?: string,
  limit: number = 50
): Promise<Array<{ label: string; value: string }>> => {
  const where: Prisma.UserWhereInput = {}

  // Apply status filter (default: active - column options thường chỉ cần active items)
  applyColumnOptionsStatusFilter(where, "active")

  // Apply search filter based on column
  if (search && search.trim()) {
    switch (column) {
      case "email":
        applyColumnOptionsSearchFilter(where, search, "email")
        break
      case "name":
        applyColumnOptionsSearchFilter(where, search, "name")
        break
      default:
        applyColumnOptionsSearchFilter(where, search, "email")
    }
  }

  // Build select based on column
  let selectField: Prisma.UserSelect
  switch (column) {
    case "email":
      selectField = { email: true }
      break
    case "name":
      selectField = { name: true }
      break
    default:
      selectField = { email: true }
  }

  const results = await prisma.user.findMany({
    where,
    select: selectField,
    orderBy: { [column]: "asc" },
    take: limit,
  })

  // Map results to options format
  return mapToColumnOptions(results, column)
};

export const getActiveRoles = async (): Promise<Array<{ id: string; name: string; displayName: string }>> => {
  const roles = await prisma.role.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      displayName: true,
    },
    orderBy: {
      displayName: "asc",
    },
  })
  return roles
};

export const getActiveRolesForSelect = async (): Promise<Array<{ label: string; value: string }>> => {
  const roles = await prisma.role.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      displayName: true,
    },
    orderBy: {
      displayName: "asc",
    },
  })

  return roles.map((role) => ({
    label: role.displayName || role.name,
    value: role.id,
  }))
};

export const getActiveUsersForSelect = async (limit: number = 100): Promise<Array<{ label: string; value: string }>> => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
    take: limit,
  })

  return users.map((user) => ({
    label: user.name ? `${user.name} (${user.email})` : user.email || user.id,
    value: user.id,
  }))
};

export const getUserById = async (id: string): Promise<ListedUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return mapUserRecord(user)
};

export const getUserDetailById = async (id: string): Promise<UserDetail | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    return null
  }

  // Map user record to UserDetail format (bao gồm các fields detail)
  return {
    ...mapUserRecord(user),
    bio: user.bio,
    phone: user.phone,
    address: user.address,
    emailVerified: user.emailVerified,
    updatedAt: user.updatedAt,
  }
};

// Re-export helpers for convenience
export { mapUserRecord, type UserWithRoles } from "./helpers"
