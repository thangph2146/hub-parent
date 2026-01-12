/**
 * Helper functions để check permissions và super admin
 */
import type { Permission } from "@/constants/permissions"
import { DEFAULT_ROLES } from "@/constants/permissions"

/**
 * Check if user is super admin based on roles
 */
export const isSuperAdmin = (roles: Array<{ name: string }>): boolean =>
  roles.some((role) => role.name === DEFAULT_ROLES.SUPER_ADMIN.name)

/**
 * Check if user is admin based on roles
 */
export const isAdmin = (roles: Array<{ name: string }>): boolean =>
  roles.some((role) => role.name === DEFAULT_ROLES.ADMIN.name)

/**
 * Check if user is super admin or admin
 */
export const isAdminOrSuperAdmin = (roles: Array<{ name: string }>): boolean =>
  isSuperAdmin(roles) || isAdmin(roles)

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

/**
 * Check if user has permission
 */
export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => userPermissions.includes(requiredPermission)

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => requiredPermissions.some((perm) => userPermissions.includes(perm))

/**
 * Check if user has all required permissions
 */
export const hasAllPermissions = (
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean => requiredPermissions.every((perm) => userPermissions.includes(perm))

