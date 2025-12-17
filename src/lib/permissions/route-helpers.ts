/**
 * Route Helpers - Utilities để extract và work với routes từ ROUTE_CONFIG
 */

import { ROUTE_CONFIG, type RoutePermissionConfig } from "./route-config"

/**
 * Get all page routes từ ROUTE_CONFIG
 */
export const getPageRoutes = (): RoutePermissionConfig[] =>
  ROUTE_CONFIG.filter((config) => config.type === "page")

/**
 * Get routes cho một resource name
 */
export const getResourceRoutes = (resourceName: string): RoutePermissionConfig[] =>
  ROUTE_CONFIG.filter(
    (config) => config.type === "page" && config.path.startsWith(`/admin/${resourceName}`)
  )

/**
 * Get main route (list page) cho một resource
 */
export const getResourceMainRoute = (resourceName: string): RoutePermissionConfig | undefined => {
  const expectedPath = `/admin/${resourceName}`
  return ROUTE_CONFIG.find(
    (config) => config.type === "page" && config.path === expectedPath
  )
}

/**
 * Get create route cho một resource
 */
export const getResourceCreateRoute = (resourceName: string): RoutePermissionConfig | undefined =>
  ROUTE_CONFIG.find(
    (config) => config.type === "page" && config.path === `/admin/${resourceName}/new`
  )

/**
 * Get all sub-routes (custom pages) cho một resource
 */
export const getResourceSubRoutes = (resourceName: string): RoutePermissionConfig[] =>
  ROUTE_CONFIG.filter(
    (config) =>
      config.type === "page" &&
      config.path.startsWith(`/admin/${resourceName}/`) &&
      config.path !== `/admin/${resourceName}` &&
      config.path !== `/admin/${resourceName}/new` &&
      !config.path.includes("/[id]")
  )

/**
 * Normalize pathname để match với route patterns
 * Converts dynamic segments [id] to match pattern
 */
export const normalizePathname = (pathname: string): string => {
  const withoutQuery = pathname.split("?")[0]
  return withoutQuery.replace(/\/$/, "") || "/"
}

/**
 * Match route pattern với pathname
 * Supports dynamic segments like [id]
 */
export const matchPattern = (pattern: string, pathname: string): boolean => {
  const normalizedPattern = normalizePathname(pattern)
  const normalizedPathname = normalizePathname(pathname)

  if (normalizedPattern === normalizedPathname) {
    return true
  }

  const patternRegex = normalizedPattern
    .replace(/\[id\]/g, "[^/]+")
    .replace(/\//g, "\\/")
  const regex = new RegExp(`^${patternRegex}$`)

  return regex.test(normalizedPathname)
}
