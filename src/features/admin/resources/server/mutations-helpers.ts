/**
 * Shared Mutation Helpers for Admin Features
 * 
 * Các helper functions được dùng chung bởi tất cả admin features
 * để đảm bảo consistency và giảm duplicate code
 */

import type { Permission } from "@/lib/permissions"
import { canPerformAction } from "@/lib/permissions"
import { ForbiddenError } from "./errors"

/**
 * Auth context interface
 * Được sử dụng trong tất cả mutations để check permissions
 */
export interface AuthContext {
  actorId: string
  permissions: Permission[]
  roles: Array<{ name: string }>
}

/**
 * Ensure user has at least one of the required permissions
 * 
 * @param ctx - Auth context
 * @param required - Array of required permissions (user needs at least one)
 * @throws ForbiddenError if user doesn't have any required permission
 */
export function ensurePermission(ctx: AuthContext, ...required: Permission[]): void {
  const allowed = required.some((perm) => canPerformAction(ctx.permissions, ctx.roles, perm))
  if (!allowed) {
    throw new ForbiddenError()
  }
}

