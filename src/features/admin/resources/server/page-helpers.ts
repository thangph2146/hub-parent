/**
 * Shared Page Helpers for Admin Features
 * 
 * Helper functions để check permissions cho page components
 * Giảm duplicate code trong các page.tsx files
 */

import { canPerformAction, canPerformAnyAction, type Permission } from "@/lib/permissions"
import { getAuthInfo, type AuthInfo } from "./auth-helpers"

/**
 * Permission flags for table actions
 */
export interface TablePermissions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  canCreate: boolean
}

/**
 * Get table permissions for a resource
 * 
 * @param authInfo - Auth info from getAuthInfo()
 * @param resourcePermissions - Resource-specific permissions
 * @returns TablePermissions object
 */
export function getTablePermissions(
  authInfo: AuthInfo,
  resourcePermissions: {
    delete: Permission[]
    restore: Permission[]
    manage: Permission
    create: Permission
  }
): TablePermissions {
  const { permissions, roles } = authInfo

  return {
    canDelete: canPerformAnyAction(permissions, roles, resourcePermissions.delete),
    canRestore: canPerformAnyAction(permissions, roles, resourcePermissions.restore),
    canManage: canPerformAction(permissions, roles, resourcePermissions.manage),
    canCreate: canPerformAction(permissions, roles, resourcePermissions.create),
  }
}

/**
 * Get table permissions for a resource (convenience function)
 * Fetches auth info and returns table permissions in one call
 * 
 * @param resourcePermissions - Resource-specific permissions
 * @returns TablePermissions object
 */
export async function getTablePermissionsAsync(
  resourcePermissions: {
    delete: Permission[]
    restore: Permission[]
    manage: Permission
    create: Permission
  }
): Promise<TablePermissions> {
  const authInfo = await getAuthInfo()
  return getTablePermissions(authInfo, resourcePermissions)
}

