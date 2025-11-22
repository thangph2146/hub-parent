"use server"

import bcrypt from "bcryptjs"
import type { Prisma } from "@prisma/client"
import { PERMISSIONS, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { resourceLogger } from "@/lib/config"
import { mapUserRecord, type ListedUser, type UserWithRoles } from "./queries"
import { notifySuperAdminsOfUserAction, notifySuperAdminsOfBulkUserAction } from "./notifications"
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ensurePermission,
  invalidateResourceCache,
  invalidateResourceCacheBulk,
  type AuthContext,
} from "@/features/admin/resources/server"
import { emitUserUpsert, emitUserRemove, emitBatchUserUpsert, type UserStatus } from "./events"
import { createUserSchema, updateUserSchema, type CreateUserSchema, type UpdateUserSchema } from "./validation"
import { PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"

// Re-export for backward compatibility with API routes
export { ApplicationError, ForbiddenError, NotFoundError, type AuthContext }

/**
 * Helper để xử lý bulk operations với error handling và logging
 */
async function handleBulkOperation<T>(
  operation: () => Promise<T>,
  action: "bulk-delete" | "bulk-restore" | "bulk-hard-delete",
  metadata: Record<string, unknown>,
  errorType?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    resourceLogger.actionFlow({
      resource: "users",
      action,
      step: "error",
      metadata: {
        ...metadata,
        error: error instanceof Error ? error.message : String(error),
        ...(errorType && { errorType }),
      },
    })
    return null
  }
}

export interface BulkActionResult {
  count: number
}

function sanitizeUser(user: UserWithRoles): ListedUser {
  return mapUserRecord(user)
}

export async function createUser(ctx: AuthContext, input: CreateUserSchema): Promise<ListedUser> {
  ensurePermission(ctx, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_MANAGE)

  // Validate input với zod
  const validatedInput = createUserSchema.parse(input)

  const existing = await prisma.user.findUnique({ where: { email: validatedInput.email } })
  if (existing) {
    throw new ApplicationError("Email đã tồn tại", 400)
  }

  const passwordHash = await bcrypt.hash(validatedInput.password, 10)

  const user = await prisma.user.create({
    data: {
      email: validatedInput.email,
      name: validatedInput.name ?? null,
      password: passwordHash,
      isActive: validatedInput.isActive ?? true,
      bio: validatedInput.bio,
      phone: validatedInput.phone,
      address: validatedInput.address,
      userRoles: validatedInput.roleIds && validatedInput.roleIds.length > 0
        ? {
            create: validatedInput.roleIds.map((roleId) => ({
              roleId,
            })),
          }
        : undefined,
    },
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

  // Tạo system notification cho super admin
  await notifySuperAdminsOfUserAction(
    "create",
    ctx.actorId,
    {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  )

  // Emit socket event
  await emitUserUpsert(user.id, null)

  // Invalidate cache
  await invalidateResourceCache({ resource: "users", id: user.id })

  resourceLogger.actionFlow({
    resource: "users",
    action: "create",
    step: "success",
    metadata: {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    },
  })

  return sanitizeUser(user)
}

export async function updateUser(ctx: AuthContext, id: string, input: UpdateUserSchema): Promise<ListedUser> {
  ensurePermission(ctx, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE)

  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID người dùng không hợp lệ", 400)
  }

  // Validate input với zod
  const validatedInput = updateUserSchema.parse(input)

  const existing = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("User không tồn tại")
  }

  // Check if email is already used by another user
  if (validatedInput.email !== undefined && validatedInput.email !== existing.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: validatedInput.email } })
    if (emailExists) {
      throw new ApplicationError("Email đã được sử dụng", 400)
    }
  }

  // Validate roleIds if provided - check if roles exist
  if (validatedInput.roleIds !== undefined && validatedInput.roleIds.length > 0) {
    const roles = await prisma.role.findMany({
      where: { id: { in: validatedInput.roleIds } },
      select: { id: true },
    })
    if (roles.length !== validatedInput.roleIds.length) {
      throw new ApplicationError("Một số vai trò không tồn tại", 400)
    }
  }

  const updateData: Prisma.UserUpdateInput = {}

  // Track changes để tạo notification
  const changes: {
    email?: { old: string; new: string }
    isActive?: { old: boolean; new: boolean }
    roles?: { old: string[]; new: string[] }
  } = {}

  if (validatedInput.email !== undefined) {
    const newEmail = validatedInput.email.trim()
    if (newEmail !== existing.email) {
      changes.email = { old: existing.email, new: newEmail }
      updateData.email = newEmail
    }
  }
  if (validatedInput.name !== undefined) updateData.name = validatedInput.name?.trim() || null
  if (validatedInput.isActive !== undefined) {
    // Không cho phép vô hiệu hóa super admin
    if (existing.email === PROTECTED_SUPER_ADMIN_EMAIL && validatedInput.isActive === false) {
      throw new ForbiddenError("Không thể vô hiệu hóa tài khoản super admin")
    }
    
    // Track isActive changes
    if (validatedInput.isActive !== existing.isActive) {
      changes.isActive = { old: existing.isActive, new: validatedInput.isActive }
    }
    updateData.isActive = validatedInput.isActive
  }
  if (validatedInput.bio !== undefined) updateData.bio = validatedInput.bio?.trim() || null
  if (validatedInput.phone !== undefined) updateData.phone = validatedInput.phone?.trim() || null
  if (validatedInput.address !== undefined) updateData.address = validatedInput.address?.trim() || null
  if (validatedInput.password && validatedInput.password.trim() !== "") {
    updateData.password = await bcrypt.hash(validatedInput.password, 10)
  }

  const shouldUpdateRoles = Array.isArray(validatedInput.roleIds)
  
  // Track role changes
  if (shouldUpdateRoles) {
    const oldRoleNames = existing.userRoles.map((ur) => ur.role.name).sort()
    // Get new role names
    const newRoleIds = validatedInput.roleIds || []
    const newRoles = await prisma.role.findMany({
      where: { id: { in: newRoleIds } },
      select: { name: true },
    })
    const newRoleNames = newRoles.map((r) => r.name).sort()
    
    if (JSON.stringify(oldRoleNames) !== JSON.stringify(newRoleNames)) {
      changes.roles = { old: oldRoleNames, new: newRoleNames }
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.user.update({
        where: { id },
        data: updateData,
      })
    }

    if (shouldUpdateRoles) {
      await tx.userRole.deleteMany({
        where: { userId: id },
      })

      if (validatedInput.roleIds && validatedInput.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: validatedInput.roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        })
      }
    }

    const updated = await tx.user.findUnique({
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

    if (!updated) {
      throw new NotFoundError("User không tồn tại")
    }

    return updated
  })

  // Tạo system notification cho super admin nếu có thay đổi quan trọng
  if (Object.keys(changes).length > 0) {
    await notifySuperAdminsOfUserAction(
      "update",
      ctx.actorId,
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      changes
    )
  }

  // Emit socket event
  const previousStatus: "active" | "deleted" = existing.deletedAt ? "deleted" : "active"
  await emitUserUpsert(user.id, previousStatus)

  // Invalidate cache - QUAN TRỌNG: phải invalidate detail page để cập nhật ngay
  await invalidateResourceCache({ resource: "users", id: user.id })

  return sanitizeUser(user)
}

export async function softDeleteUser(ctx: AuthContext, id: string): Promise<void> {
  ensurePermission(ctx, PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.deletedAt) {
    throw new NotFoundError("User không tồn tại")
  }

  // Không cho phép xóa super admin
  if (user.email === PROTECTED_SUPER_ADMIN_EMAIL) {
    throw new ForbiddenError("Không thể xóa tài khoản super admin")
  }

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  // Tạo system notification cho super admin
  await notifySuperAdminsOfUserAction(
    "delete",
    ctx.actorId,
    {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  )

  // Emit socket event
  await emitUserUpsert(id, "active")

  // Invalidate cache
  await invalidateResourceCache({ resource: "users", id })
}

export async function bulkSoftDeleteUsers(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  ensurePermission(ctx, PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách người dùng trống", 400)
  }

  // Lấy thông tin users trước khi delete để kiểm tra và tạo notifications
  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, email: true, name: true },
  })

  const foundIds = users.map(u => u.id)
  const notFoundIds = ids.filter(id => !foundIds.includes(id))
  
  // Log để debug với đầy đủ thông tin
  resourceLogger.actionFlow({
    resource: "users",
    action: "bulk-delete",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: users.length,
      notFoundCount: notFoundIds.length,
      requestedIds: ids,
      foundIds,
      notFoundIds,
    },
  })

  // Kiểm tra xem có super admin trong danh sách không
  const superAdminUser = users.find((u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL)
  if (superAdminUser) {
    throw new ForbiddenError("Không thể xóa tài khoản super admin")
  }

  // Filter ra super admin từ danh sách IDs (nếu có)
  const filteredIds = users
    .filter((u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL)
    .map((u) => u.id)

  if (filteredIds.length === 0) {
    // Tạo error message rõ ràng hơn
    const alreadyDeletedCount = ids.length - users.length
    const superAdminCount = users.filter((u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL).length
    
    let errorMessage = "Không có người dùng nào có thể xóa"
    if (alreadyDeletedCount > 0) {
      errorMessage += `. ${alreadyDeletedCount} người dùng đã bị xóa trước đó`
    }
    if (superAdminCount > 0) {
      errorMessage += `. ${superAdminCount} người dùng là super admin và không thể xóa`
    }
    if (users.length === 0 && ids.length > 0) {
      errorMessage = `Không tìm thấy người dùng nào trong danh sách (có thể đã bị xóa hoặc không tồn tại)`
    }
    
    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-delete",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: users.length,
        alreadyDeletedCount,
        superAdminCount,
        error: errorMessage,
      },
    })
    
    throw new ApplicationError(errorMessage, 400)
  }

  const result = await prisma.user.updateMany({
    where: {
      id: { in: filteredIds },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  // Emit socket events và tạo bulk notification
  const deletableUsers = users.filter((u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL)
  if (result.count > 0 && deletableUsers.length > 0) {
    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-delete",
      step: "start",
      metadata: { count: result.count, userIds: deletableUsers.map(u => u.id) },
    })

    // Batch emit socket events
    await handleBulkOperation(
      () => emitBatchUserUpsert(deletableUsers.map(u => u.id), "active"),
      "bulk-delete",
      { count: result.count }
    )

    // Tạo bulk notification với tên records
    await handleBulkOperation(
      () => notifySuperAdminsOfBulkUserAction("delete", ctx.actorId, result.count, deletableUsers),
      "bulk-delete",
      { count: result.count },
      "notification"
    )

    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-delete",
      step: "success",
      metadata: { count: result.count },
    })
  }

  // Invalidate cache cho bulk operation
  await invalidateResourceCacheBulk({ resource: "users" })

  return { count: result.count }
}

export async function restoreUser(ctx: AuthContext, id: string): Promise<void> {
  ensurePermission(ctx, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE)

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || !user.deletedAt) {
    throw new NotFoundError("User không tồn tại hoặc chưa bị xóa")
  }

  await prisma.user.update({
    where: { id },
    data: {
      deletedAt: null,
      isActive: true,
    },
  })

  // Tạo system notification cho super admin
  await notifySuperAdminsOfUserAction(
    "restore",
    ctx.actorId,
    {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  )

  // Emit socket event
  await emitUserUpsert(id, "deleted")

  // Invalidate cache
  await invalidateResourceCache({ resource: "users", id })

  resourceLogger.actionFlow({
    resource: "users",
    action: "restore",
    step: "success",
    metadata: {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
    },
  })
}

export async function bulkRestoreUsers(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  ensurePermission(ctx, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách người dùng trống", 400)
  }

  // Lấy thông tin users trước khi restore để tạo notifications
  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    select: { id: true, email: true, name: true },
  })

  const foundIds = users.map(u => u.id)
  const notFoundIds = ids.filter(id => !foundIds.includes(id))
  
  // Log để debug với đầy đủ thông tin
  resourceLogger.actionFlow({
    resource: "users",
    action: "bulk-restore",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: users.length,
      notFoundCount: notFoundIds.length,
      requestedIds: ids,
      foundIds,
      notFoundIds,
    },
  })

  // Kiểm tra nếu không có user nào để restore
  if (users.length === 0) {
    const allUsers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: true, deletedAt: true },
    })
    const alreadyActiveCount = allUsers.filter(u => u.deletedAt === null).length
    const notFoundCount = ids.length - allUsers.length
    const notFoundIds = ids.filter(id => !allUsers.some(u => u.id === id))
    
    let errorMessage = "Không có người dùng nào có thể khôi phục"
    if (alreadyActiveCount > 0) {
      errorMessage += `. ${alreadyActiveCount} người dùng đang ở trạng thái hoạt động`
    }
    if (notFoundCount > 0) {
      errorMessage += `. ${notFoundCount} người dùng không tồn tại`
    }
    
    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-restore",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: users.length,
        notFoundCount,
        alreadyActiveCount,
        requestedIds: ids,
        foundIds,
        notFoundIds,
        error: errorMessage,
      },
    })
    
    throw new ApplicationError(errorMessage, 400)
  }

  const result = await prisma.user.updateMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
      isActive: true,
    },
  })

  // Emit socket events và tạo bulk notification
  if (result.count > 0 && users.length > 0) {
    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-restore",
      step: "start",
      metadata: { count: result.count, userIds: users.map(u => u.id) },
    })

    // Batch emit socket events
    await handleBulkOperation(
      () => emitBatchUserUpsert(users.map(u => u.id), "deleted"),
      "bulk-restore",
      { count: result.count }
    )

    // Tạo bulk notification với tên records
    await handleBulkOperation(
      () => notifySuperAdminsOfBulkUserAction("restore", ctx.actorId, result.count, users),
      "bulk-restore",
      { count: result.count },
      "notification"
    )

    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-restore",
      step: "success",
      metadata: { count: result.count },
    })
  }

  // Invalidate cache cho bulk operation
  await invalidateResourceCacheBulk({ resource: "users" })

  return { count: result.count }
}

export async function hardDeleteUser(ctx: AuthContext, id: string): Promise<void> {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.USERS_MANAGE])) {
    throw new ForbiddenError()
  }

  // Lấy thông tin user trước khi delete để kiểm tra và tạo notification
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, deletedAt: true },
  })

  if (!user) {
    throw new NotFoundError("User không tồn tại")
  }

  // Không cho phép xóa super admin
  if (user.email === PROTECTED_SUPER_ADMIN_EMAIL) {
    throw new ForbiddenError("Không thể xóa vĩnh viễn tài khoản super admin")
  }

  await prisma.user.delete({
    where: { id },
  })

  // Tạo system notification cho super admin
  await notifySuperAdminsOfUserAction(
    "hard-delete",
    ctx.actorId,
    {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  )

  // Emit socket event - cần lấy previousStatus trước khi delete
  const previousStatus: "active" | "deleted" = user.deletedAt ? "deleted" : "active"
  emitUserRemove(id, previousStatus)

  // Invalidate cache
  await invalidateResourceCache({ resource: "users", id })
}

export async function bulkHardDeleteUsers(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.USERS_MANAGE])) {
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách người dùng trống", 400)
  }

  // Lấy thông tin users trước khi delete để kiểm tra và tạo notifications
  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, email: true, name: true, deletedAt: true },
  })

  const foundIds = users.map(u => u.id)
  const notFoundIds = ids.filter(id => !foundIds.includes(id))
  
  // Log để debug với đầy đủ thông tin
  resourceLogger.actionFlow({
    resource: "users",
    action: "bulk-hard-delete",
    step: "start",
    metadata: {
      requestedCount: ids.length,
      foundCount: users.length,
      notFoundCount: notFoundIds.length,
      requestedIds: ids,
      foundIds,
      notFoundIds,
    },
  })

  // Kiểm tra xem có super admin trong danh sách không
  const superAdminUser = users.find((u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL)
  if (superAdminUser) {
    throw new ForbiddenError("Không thể xóa vĩnh viễn tài khoản super admin")
  }

  // Filter ra super admin từ danh sách IDs (nếu có)
  const filteredIds = users
    .filter((u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL)
    .map((u) => u.id)

  if (filteredIds.length === 0) {
    // Tạo error message rõ ràng hơn
    const notFoundCount = notFoundIds.length
    const superAdminCount = users.filter((u) => u.email === PROTECTED_SUPER_ADMIN_EMAIL).length
    
    let errorMessage = "Không có người dùng nào có thể xóa vĩnh viễn"
    if (notFoundCount > 0) {
      errorMessage += `. ${notFoundCount} người dùng không tồn tại`
    }
    if (superAdminCount > 0) {
      errorMessage += `. ${superAdminCount} người dùng là super admin và không thể xóa`
    }
    if (users.length === 0 && ids.length > 0) {
      errorMessage = `Không tìm thấy người dùng nào trong danh sách`
    }
    
    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-hard-delete",
      step: "error",
      metadata: {
        requestedCount: ids.length,
        foundCount: users.length,
        notFoundCount,
        superAdminCount,
        requestedIds: ids,
        foundIds,
        notFoundIds,
        error: errorMessage,
      },
    })
    
    throw new ApplicationError(errorMessage, 400)
  }

  const result = await prisma.user.deleteMany({
    where: {
      id: { in: filteredIds },
    },
  })

  // Emit socket events và tạo bulk notification
  const deletableUsers = users.filter((u) => u.email !== PROTECTED_SUPER_ADMIN_EMAIL)
  if (result.count > 0) {
    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-hard-delete",
      step: "start",
      metadata: { count: result.count, userIds: deletableUsers.map(u => u.id) },
    })

    // Emit batch remove events
    const { getSocketServer } = await import("@/lib/socket/state")
    const io = getSocketServer()
    if (io && deletableUsers.length > 0) {
      const removeEvents = deletableUsers.map((user) => ({
        id: user.id,
        previousStatus: (user.deletedAt ? "deleted" : "active") as UserStatus,
      }))
      io.to("role:super_admin").emit("user:batch-remove", { users: removeEvents })
    }

    // Tạo bulk notification với tên records
    await notifySuperAdminsOfBulkUserAction(
      "hard-delete",
      ctx.actorId,
      result.count,
      deletableUsers
    )

    resourceLogger.actionFlow({
      resource: "users",
      action: "bulk-hard-delete",
      step: "success",
      metadata: { count: result.count },
    })
  }

  // Invalidate cache cho bulk operation
  await invalidateResourceCacheBulk({ resource: "users" })

  return { count: result.count }
}
