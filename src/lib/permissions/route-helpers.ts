/**
 * Route Helpers - Utilities để extract và work với routes từ ROUTE_CONFIG
 */

import { ROUTE_CONFIG, type RoutePermissionConfig } from "./route-config"

/**
 * Get all page routes từ ROUTE_CONFIG
 */
export function getPageRoutes(): RoutePermissionConfig[] {
  return ROUTE_CONFIG.filter((config) => config.type === "page")
}

/**
 * Get routes cho một resource name
 */
export function getResourceRoutes(resourceName: string): RoutePermissionConfig[] {
  return ROUTE_CONFIG.filter(
    (config) => config.type === "page" && config.path.startsWith(`/admin/${resourceName}`)
  )
}

/**
 * Get main route (list page) cho một resource
 */
export function getResourceMainRoute(resourceName: string): RoutePermissionConfig | undefined {
  return ROUTE_CONFIG.find(
    (config) => config.type === "page" && config.path === `/admin/${resourceName}`
  )
}

/**
 * Get create route cho một resource
 */
export function getResourceCreateRoute(resourceName: string): RoutePermissionConfig | undefined {
  return ROUTE_CONFIG.find(
    (config) => config.type === "page" && config.path === `/admin/${resourceName}/new`
  )
}

/**
 * Get all sub-routes (custom pages) cho một resource
 */
export function getResourceSubRoutes(resourceName: string): RoutePermissionConfig[] {
  return ROUTE_CONFIG.filter(
    (config) =>
      config.type === "page" &&
      config.path.startsWith(`/admin/${resourceName}/`) &&
      config.path !== `/admin/${resourceName}` &&
      config.path !== `/admin/${resourceName}/new` &&
      !config.path.includes("/[id]")
  )
}

/**
 * Normalize pathname để match với route patterns
 * Converts dynamic segments [id] to match pattern
 */
export function normalizePathname(pathname: string): string {
  // Remove query strings
  const withoutQuery = pathname.split("?")[0]
  // Normalize trailing slashes
  return withoutQuery.replace(/\/$/, "") || "/"
}

/**
 * Match route pattern với pathname
 * Supports dynamic segments like [id]
 */
export function matchPattern(pattern: string, pathname: string): boolean {
  const normalizedPattern = normalizePathname(pattern)
  const normalizedPathname = normalizePathname(pathname)

  // Exact match
  if (normalizedPattern === normalizedPathname) {
    return true
  }

  // Pattern matching với dynamic segments
  const patternRegex = normalizedPattern
    .replace(/\[id\]/g, "[^/]+")
    .replace(/\//g, "\\/")
  const regex = new RegExp(`^${patternRegex}$`)

  return regex.test(normalizedPathname)
}
