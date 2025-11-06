import type { Prisma } from "@prisma/client"
import type { Permission } from "@/lib/permissions"
import { PERMISSIONS, canPerformAction, canPerformAnyAction } from "@/lib/permissions"
import { prisma } from "@/lib/database"
import { mapRoleRecord, type ListedRole, type RoleWithRelations } from "./queries"

export interface AuthContext {
  actorId: string
  permissions: Permission[]
  roles: Array<{ name: string }>
}

export class ApplicationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = "Forbidden") {
    super(message, 403)
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = "Not found") {
    super(message, 404)
  }
}

export interface CreateRoleInput {
  name: string
  displayName: string
  description?: string | null
  permissions?: string[]
  isActive?: boolean
}

export interface UpdateRoleInput {
  name?: string
  displayName?: string
  description?: string | null
  permissions?: string[]
  isActive?: boolean
}

export interface BulkActionResult {
  count: number
}

function ensurePermission(ctx: AuthContext, ...required: Permission[]) {
  const allowed = required.some((perm) => canPerformAction(ctx.permissions, ctx.roles, perm))
  if (!allowed) {
    throw new ForbiddenError()
  }
}

function sanitizeRole(role: RoleWithRelations): ListedRole {
  return mapRoleRecord(role)
}

export async function createRole(ctx: AuthContext, input: CreateRoleInput): Promise<ListedRole> {
  ensurePermission(ctx, PERMISSIONS.ROLES_CREATE, PERMISSIONS.ROLES_MANAGE)

  if (!input.name || !input.displayName) {
    throw new ApplicationError("Tên vai trò và tên hiển thị là bắt buộc", 400)
  }

  // Validate name format
  const nameRegex = /^[a-z0-9_-]+$/
  if (!nameRegex.test(input.name.trim())) {
    throw new ApplicationError(
      "Tên vai trò chỉ được chứa chữ thường, số, dấu gạch dưới và dấu gạch ngang",
      400
    )
  }

  const existing = await prisma.role.findUnique({ where: { name: input.name.trim() } })
  if (existing) {
    throw new ApplicationError("Tên vai trò đã tồn tại", 400)
  }

  // Validate permissions if provided
  if (input.permissions && Array.isArray(input.permissions)) {
    const allPermissions = Object.values(PERMISSIONS)
    const invalidPermissions = input.permissions.filter((perm) => !allPermissions.includes(perm as Permission))
    if (invalidPermissions.length > 0) {
      throw new ApplicationError(`Các quyền không hợp lệ: ${invalidPermissions.join(", ")}`, 400)
    }
  }

  const role = await prisma.role.create({
    data: {
      name: input.name.trim(),
      displayName: input.displayName.trim(),
      description: input.description?.trim() || null,
      permissions: input.permissions || [],
      isActive: input.isActive ?? true,
    },
  })

  return sanitizeRole(role)
}

export async function updateRole(ctx: AuthContext, id: string, input: UpdateRoleInput): Promise<ListedRole> {
  ensurePermission(ctx, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE)

  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    throw new ApplicationError("ID vai trò không hợp lệ", 400)
  }

  const existing = await prisma.role.findUnique({
    where: { id },
  })

  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Vai trò không tồn tại")
  }

  // Validate name if provided
  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim() === "") {
      throw new ApplicationError("Tên vai trò không được để trống", 400)
    }

    const nameRegex = /^[a-z0-9_-]+$/
    if (!nameRegex.test(input.name.trim())) {
      throw new ApplicationError(
        "Tên vai trò chỉ được chứa chữ thường, số, dấu gạch dưới và dấu gạch ngang",
        400
      )
    }

    // Check if name is already used by another role
    if (input.name.trim() !== existing.name) {
      const nameExists = await prisma.role.findUnique({ where: { name: input.name.trim() } })
      if (nameExists) {
        throw new ApplicationError("Tên vai trò đã được sử dụng", 400)
      }
    }
  }

  // Validate displayName if provided
  if (input.displayName !== undefined) {
    if (typeof input.displayName !== "string" || input.displayName.trim() === "") {
      throw new ApplicationError("Tên hiển thị không được để trống", 400)
    }
    if (input.displayName.trim().length < 2) {
      throw new ApplicationError("Tên hiển thị phải có ít nhất 2 ký tự", 400)
    }
  }

  // Validate permissions if provided
  if (input.permissions !== undefined) {
    if (!Array.isArray(input.permissions)) {
      throw new ApplicationError("permissions phải là một mảng", 400)
    }
    const allPermissions = Object.values(PERMISSIONS)
    const invalidPermissions = input.permissions.filter((perm) => !allPermissions.includes(perm as Permission))
    if (invalidPermissions.length > 0) {
      throw new ApplicationError(`Các quyền không hợp lệ: ${invalidPermissions.join(", ")}`, 400)
    }
  }

  const updateData: Prisma.RoleUpdateInput = {}

  if (input.name !== undefined) updateData.name = input.name.trim()
  if (input.displayName !== undefined) updateData.displayName = input.displayName.trim()
  if (input.description !== undefined) updateData.description = input.description?.trim() || null
  if (input.permissions !== undefined) updateData.permissions = input.permissions
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  const role = await prisma.role.update({
    where: { id },
    data: updateData,
  })

  return sanitizeRole(role)
}

export async function softDeleteRole(ctx: AuthContext, id: string): Promise<void> {
  ensurePermission(ctx, PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_MANAGE)

  const role = await prisma.role.findUnique({ where: { id } })
  if (!role || role.deletedAt) {
    throw new NotFoundError("Vai trò không tồn tại")
  }

  // Prevent deleting super_admin role
  if (role.name === "super_admin") {
    throw new ApplicationError("Không thể xóa vai trò super_admin", 400)
  }

  await prisma.role.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })
}

export async function bulkSoftDeleteRoles(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  ensurePermission(ctx, PERMISSIONS.ROLES_DELETE, PERMISSIONS.ROLES_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách vai trò trống", 400)
  }

  // Check if any role is super_admin
  const roles = await prisma.role.findMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    select: { id: true, name: true },
  })

  const superAdminRole = roles.find((r) => r.name === "super_admin")
  if (superAdminRole) {
    throw new ApplicationError("Không thể xóa vai trò super_admin", 400)
  }

  const result = await prisma.role.updateMany({
    where: {
      id: { in: ids },
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  })

  return { count: result.count }
}

export async function restoreRole(ctx: AuthContext, id: string): Promise<void> {
  ensurePermission(ctx, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE)

  const role = await prisma.role.findUnique({ where: { id } })
  if (!role || !role.deletedAt) {
    throw new NotFoundError("Vai trò không tồn tại hoặc chưa bị xóa")
  }

  await prisma.role.update({
    where: { id },
    data: {
      deletedAt: null,
      isActive: true,
    },
  })
}

export async function bulkRestoreRoles(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  ensurePermission(ctx, PERMISSIONS.ROLES_UPDATE, PERMISSIONS.ROLES_MANAGE)

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách vai trò trống", 400)
  }

  const result = await prisma.role.updateMany({
    where: {
      id: { in: ids },
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
      isActive: true,
    },
  })

  return { count: result.count }
}

export async function hardDeleteRole(ctx: AuthContext, id: string): Promise<void> {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.ROLES_MANAGE])) {
    throw new ForbiddenError()
  }

  const role = await prisma.role.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!role) {
    throw new NotFoundError("Vai trò không tồn tại")
  }

  // Prevent deleting super_admin role
  if (role.name === "super_admin") {
    throw new ApplicationError("Không thể xóa vĩnh viễn vai trò super_admin", 400)
  }

  await prisma.role.delete({
    where: { id },
  })
}

export async function bulkHardDeleteRoles(ctx: AuthContext, ids: string[]): Promise<BulkActionResult> {
  if (!canPerformAnyAction(ctx.permissions, ctx.roles, [PERMISSIONS.ROLES_MANAGE])) {
    throw new ForbiddenError()
  }

  if (!ids || ids.length === 0) {
    throw new ApplicationError("Danh sách vai trò trống", 400)
  }

  // Check if any role is super_admin
  const roles = await prisma.role.findMany({
    where: {
      id: { in: ids },
    },
    select: { id: true, name: true },
  })

  const superAdminRole = roles.find((r) => r.name === "super_admin")
  if (superAdminRole) {
    throw new ApplicationError("Không thể xóa vĩnh viễn vai trò super_admin", 400)
  }

  const result = await prisma.role.deleteMany({
    where: {
      id: { in: ids },
    },
  })

  return { count: result.count }
}

