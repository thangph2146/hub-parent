import { canPerformAction, canPerformAnyAction, type Permission } from "@/permissions"
import { getAuthInfo, type AuthInfo } from "./auth-helpers"

export interface TablePermissions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  canCreate: boolean
}

export const getTablePermissions = (
  authInfo: AuthInfo,
  resourcePermissions: {
    delete: Permission[]
    restore: Permission[]
    manage: Permission | Permission[]
    create: Permission
  }
): TablePermissions => {
  const { permissions, roles } = authInfo
  const managePermissions = Array.isArray(resourcePermissions.manage)
    ? resourcePermissions.manage
    : [resourcePermissions.manage]

  return {
    canDelete: canPerformAnyAction(permissions, roles, resourcePermissions.delete),
    canRestore: canPerformAnyAction(permissions, roles, resourcePermissions.restore),
    canManage: canPerformAnyAction(permissions, roles, managePermissions),
    canCreate: canPerformAction(permissions, roles, resourcePermissions.create),
  }
}

export const getTablePermissionsAsync = async (
  resourcePermissions: {
    delete: Permission[]
    restore: Permission[]
    manage: Permission | Permission[]
    create: Permission
  }
): Promise<TablePermissions> => {
  return getTablePermissions(await getAuthInfo(), resourcePermissions)
}

