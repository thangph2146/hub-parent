/**
 * Shared utilities for permissions components
 * Used by both PermissionsTableField and PermissionsGroup
 */

export interface ParsedPermission {
  resource: string
  action: string
  fullValue: string
  displayLabel: string
}

export interface PermissionOption {
  label: string
  value: string | number
}

export interface PermissionGroup {
  label: string
  options: PermissionOption[]
}

/**
 * Extract resource name from display label (format: "Action - Resource")
 */
export const getPermissionDisplayName = (permission: ParsedPermission): string => {
  const parts = permission.displayLabel.split(" - ")
  if (parts.length === 2) {
    return parts[1] // Return resource name
  }
  return permission.resource
}

/**
 * Parse permissions from groups and group by resource
 * Same logic as used in PermissionsTableField
 */
export const parsePermissionGroups = (
  groups: PermissionGroup[],
  selectedPermissions?: string[]
): Array<{
  groupLabel: string
  resources: Array<{
    resource: string
    permissions: ParsedPermission[]
  }>
  totalCount: number
}> => {
  if (groups.length === 0) return []

  return groups.map((group) => {
    const parsedPermissions: ParsedPermission[] = group.options
      .filter((opt) => {
        if (!selectedPermissions) return true
        return selectedPermissions.includes(String(opt.value))
      })
      .map((opt) => {
        const valueStr = String(opt.value)
        const [resource, action] = valueStr.split(":")
        return {
          resource,
          action,
          fullValue: valueStr,
          displayLabel: opt.label,
        }
      })

    // Nhóm permissions theo resource
    const resourceMap = new Map<string, ParsedPermission[]>()
    parsedPermissions.forEach((perm) => {
      if (!resourceMap.has(perm.resource)) {
        resourceMap.set(perm.resource, [])
      }
      resourceMap.get(perm.resource)!.push(perm)
    })

    return {
      groupLabel: group.label,
      resources: Array.from(resourceMap.entries()).map(([resource, perms]) => ({
        resource,
        permissions: perms.sort((a, b) => {
          // Sắp xếp: view, create, update, delete trước, sau đó các actions khác
          const order = ["view", "create", "update", "delete"]
          const aIndex = order.indexOf(a.action)
          const bIndex = order.indexOf(b.action)
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.action.localeCompare(b.action)
        }),
      })),
      totalCount: parsedPermissions.length,
    }
  }).filter((group) => group.totalCount > 0) // Chỉ hiển thị nhóm có permissions
}

/**
 * Group permissions by display name
 */
export const groupPermissionsByDisplayName = (
  permissions: ParsedPermission[]
): Map<string, ParsedPermission[]> => {
  return permissions.reduce(
    (map, perm) => {
      const displayName = getPermissionDisplayName(perm)
      if (!map.has(displayName)) map.set(displayName, [])
      map.get(displayName)!.push(perm)
      return map
    },
    new Map<string, ParsedPermission[]>()
  )
}

