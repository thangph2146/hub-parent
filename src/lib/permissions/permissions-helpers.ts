/**
 * Helper functions để check permissions và super admin
 */
import type { Permission } from "./permissions"
import { DEFAULT_ROLES } from "./permissions"

/**
 * Check if user is super admin based on roles
 */
export const isSuperAdmin = (roles: Array<{ name: string }>): boolean =>
  roles.some((role) => role.name === DEFAULT_ROLES.SUPER_ADMIN.name)

/**
 * Check if user can perform action (super admin has all permissions)
 */
export const canPerformAction = (
  userPermissions: Permission[],
  userRoles: Array<{ name: string }>,
  requiredPermission: Permission
): boolean => {
  if (isSuperAdmin(userRoles)) {
    return true
  }
  return userPermissions.includes(requiredPermission)
}

/**
 * Check if user can perform any of the actions
 */
export const canPerformAnyAction = (
  userPermissions: Permission[],
  userRoles: Array<{ name: string }>,
  requiredPermissions: Permission[]
): boolean => {
  if (isSuperAdmin(userRoles)) {
    return true
  }
  return requiredPermissions.some((perm) => userPermissions.includes(perm))
}

