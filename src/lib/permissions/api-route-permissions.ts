/**
 * API Route Permissions Mapping
 * Generated từ ROUTE_CONFIG
 */

import type { Permission } from "./permissions"
import { ROUTE_CONFIG, type HttpMethod } from "./route-config"
import { matchPattern, normalizePathname } from "./route-helpers"

/**
 * API Route permissions mapping
 * Generated from ROUTE_CONFIG where type === "api"
 * Key format: "METHOD /api/path" (e.g., "GET /api/users", "POST /api/users")
 */
export const API_ROUTE_PERMISSIONS: Record<string, Permission[]> = Object.fromEntries(
  ROUTE_CONFIG.filter((config) => config.type === "api" && config.method).map((config) => [
    `${config.method} ${config.path}`,
    config.permissions,
  ])
)

/**
 * Get required permissions for an API route
 */
export const getApiRoutePermissions = (pathname: string, method: HttpMethod): Permission[] => {
  const normalized = normalizePathname(pathname)
  const exactKey = `${method} ${normalized}`

  if (API_ROUTE_PERMISSIONS[exactKey]) {
    return API_ROUTE_PERMISSIONS[exactKey]
  }

  for (const [key, permissions] of Object.entries(API_ROUTE_PERMISSIONS)) {
    const [patternMethod, patternPath] = key.split(" ", 2)
    if (patternMethod === method && matchPattern(patternPath, normalized)) {
      return permissions
    }
  }

  return []
}

/**
 * Check if an API route requires any permissions
 */
export const requiresApiPermission = (pathname: string, method: HttpMethod): boolean =>
  getApiRoutePermissions(pathname, method).length > 0
