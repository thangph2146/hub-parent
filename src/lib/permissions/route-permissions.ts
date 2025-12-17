/**
 * Route Permissions Mapping
 * Generated từ ROUTE_CONFIG
 */

import type { Permission } from "./permissions"
import { ROUTE_CONFIG } from "./route-config"
import { matchPattern, normalizePathname } from "./route-helpers"

/**
 * Page route permissions mapping
 * Generated from ROUTE_CONFIG where type === "page"
 */
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = Object.fromEntries(
  ROUTE_CONFIG.filter((config) => config.type === "page").map((config) => [config.path, config.permissions])
)

/**
 * Get required permissions for a route path
 */
export const getRoutePermissions = (pathname: string): Permission[] => {
  const normalized = normalizePathname(pathname)

  if (ROUTE_PERMISSIONS[normalized]) {
    return ROUTE_PERMISSIONS[normalized]
  }

  for (const [pattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchPattern(pattern, normalized)) {
      return permissions
    }
  }

  return []
}

/**
 * Check if a pathname requires any permissions
 */
export const requiresPermission = (pathname: string): boolean =>
  getRoutePermissions(pathname).length > 0
