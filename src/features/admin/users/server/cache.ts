/**
 * Cache Functions for Users
 * 
 * Sử dụng React cache() để:
 * - Tự động deduplicate requests trong cùng một render pass
 * - Cache kết quả để tái sử dụng
 * - Cải thiện performance với request deduplication
 * 
 * Pattern: Server Component → Cache Function → Database Query
 */

import { cache } from "react"
import { listUsers, getUserColumnOptions, type UserDetail, type ListUsersInput, type ListUsersResult } from "./queries"
import { mapUserRecord } from "./helpers"
import { prisma } from "@/lib/database"

/**
 * Cache function: List users with pagination
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho Server Components
 * 
 * @param params - ListUsersInput
 * @returns ListUsersResult
 */
export const listUsersCached = cache(async (params: ListUsersInput = {}): Promise<ListUsersResult> => {
  return listUsers(params)
})

/**
 * Cache function: Get user detail by ID
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * 
 * @param id - User ID
 * @returns User detail hoặc null nếu không tìm thấy
 */
export const getUserDetailById = cache(async (id: string): Promise<UserDetail | null> => {
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

  // Map user record to UserDetail format
  return {
    ...mapUserRecord(user),
    bio: user.bio,
    phone: user.phone,
    address: user.address,
    emailVerified: user.emailVerified,
    updatedAt: user.updatedAt,
  }
})

/**
 * Cache function: Get all active roles
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho form options, filters, etc.
 * 
 * @returns Array of active roles
 */
export const getRolesCached = cache(async () => {
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
})

/**
 * Cache function: Get user column options for filters
 */
export const getUserColumnOptionsCached = cache(
  async (
    column: string,
    search?: string,
    limit: number = 50
  ): Promise<Array<{ label: string; value: string }>> => {
    return getUserColumnOptions(column, search, limit)
  }
)

/**
 * Cache function: Get active users for select options
 * 
 * Sử dụng cache() để tự động deduplicate requests và cache kết quả
 * Dùng cho form select fields (userId, assignedTo, etc.)
 * 
 * @param limit - Maximum number of users to return (default: 100)
 * @returns Array of { label, value } options
 */
export const getActiveUsersForSelectCached = cache(
  async (limit: number = 100): Promise<Array<{ label: string; value: string }>> => {
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
  }
)

