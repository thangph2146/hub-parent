/**
 * API Route Generators - Utilities để extract và generate API routes từ ROUTE_CONFIG
 */

import { stripApiBase } from "@/lib/config/api-paths"
import { buildQueryString } from "@/lib/utils"
import { ROUTE_CONFIG, type RoutePermissionConfig } from "./route-config"
import type { HttpMethod } from "./route-config"

/**
 * Get all API routes từ ROUTE_CONFIG
 */
export const getApiRoutes = (): RoutePermissionConfig[] =>
  ROUTE_CONFIG.filter((config) => config.type === "api")

/**
 * Get admin API routes cho một resource name
 */
export const getResourceAdminApiRoutes = (resourceName: string): RoutePermissionConfig[] =>
  ROUTE_CONFIG.filter(
    (config) =>
      config.type === "api" &&
      config.method !== undefined &&
      (config.path.startsWith(`/api/admin/${resourceName}/`) || config.path === `/api/admin/${resourceName}`)
  )

/**
 * Helper to find and strip route
 */
const findAndStripRoute = (
  routes: RoutePermissionConfig[],
  predicate: (r: RoutePermissionConfig) => boolean
): string | undefined => {
  const route = routes.find(predicate)
  return route ? stripApiBase(route.path) : undefined
}

/**
 * Get API route path cho một resource và method
 */
export const getResourceApiRoute = (
  resourceName: string,
  method: HttpMethod,
  action?: "detail" | "create" | "update" | "delete" | "restore" | "hard-delete" | "bulk" | "approve" | "unapprove" | "assign" | "search" | "send" | "list"
): string | undefined => {
  const routes = getResourceAdminApiRoutes(resourceName)
  const basePath = `/api/admin/${resourceName}`
  const excludedPaths = ["/restore", "/hard-delete", "/approve", "/unapprove", "/assign"]

  if (action === "detail") {
    return findAndStripRoute(
      routes,
      (r) =>
        r.method === method &&
        r.path.includes("/[id]") &&
        !excludedPaths.some((excluded) => r.path.includes(excluded)) &&
        r.path.endsWith("/[id]")
    )
  }

  if (action === "create" || action === "send") {
    return findAndStripRoute(routes, (r) => r.method === "POST" && r.path === basePath)
  }

  if (action === "list") {
    return findAndStripRoute(routes, (r) => r.method === "GET" && r.path === basePath)
  }

  if (action === "update") {
    return findAndStripRoute(
      routes,
      (r) =>
        r.method === "PUT" &&
        r.path.includes("/[id]") &&
        !excludedPaths.some((excluded) => r.path.includes(excluded)) &&
        r.path.endsWith("/[id]")
    )
  }

  if (action === "delete") {
    return findAndStripRoute(
      routes,
      (r) => r.method === "DELETE" && r.path.includes("/[id]") && !r.path.includes("/hard-delete") && r.path.endsWith("/[id]")
    )
  }

  if (action === "restore") {
    return findAndStripRoute(routes, (r) => r.method === "POST" && r.path.includes("/[id]/restore"))
  }

  if (action === "hard-delete") {
    return findAndStripRoute(routes, (r) => r.method === "DELETE" && r.path.includes("/[id]/hard-delete"))
  }

  if (action === "bulk") {
    return findAndStripRoute(routes, (r) => r.method === "POST" && r.path.includes("/bulk"))
  }

  if (action === "approve") {
    return findAndStripRoute(routes, (r) => r.method === "POST" && r.path.includes("/[id]/approve"))
  }

  if (action === "unapprove") {
    return findAndStripRoute(routes, (r) => r.method === "POST" && r.path.includes("/[id]/unapprove"))
  }

  if (action === "assign") {
    return findAndStripRoute(routes, (r) => r.method === "POST" && r.path.includes("/[id]/assign"))
  }

  if (action === "search") {
    return findAndStripRoute(routes, (r) => r.method === "GET" && r.path.includes("/search"))
  }

  // Default: find by method
  return findAndStripRoute(routes, (r) => r.method === method)
}

/**
 * Generate standard API routes object cho một resource
 */
export const generateResourceApiRoutes = (resourceName: string) => {
  const basePath = `/admin/${resourceName}`

  // Get routes từ ROUTE_CONFIG
  const rawListRoute = getResourceApiRoute(resourceName, "GET")
  const listRoute = rawListRoute && rawListRoute.includes("/options") ? undefined : rawListRoute
  const createRoute = getResourceApiRoute(resourceName, "POST", "create")
  const detailRoute = getResourceApiRoute(resourceName, "GET", "detail")
  const updateRoute = getResourceApiRoute(resourceName, "PUT", "update")
  const deleteRoute = getResourceApiRoute(resourceName, "DELETE", "delete")
  const restoreRoute = getResourceApiRoute(resourceName, "POST", "restore")
  const hardDeleteRoute = getResourceApiRoute(resourceName, "DELETE", "hard-delete")
  const bulkRoute = getResourceApiRoute(resourceName, "POST", "bulk")

  // Options route luôn có pattern /admin/{name}/options
  const optionsRoute = `${basePath}/options`

  /**
   * Helper to replace [id] in route
   */
  const replaceId = (route: string, id: string): string => route.replace("[id]", id)

  return {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      const route = listRoute || basePath
      const queryString = params ? buildQueryString(params) : ""
      return `${route}${queryString ? `?${queryString}` : ""}`
    },
    detail: (id: string) => replaceId(detailRoute || `${basePath}/[id]`, id),
    create: createRoute || basePath,
    update: (id: string) => replaceId(updateRoute || `${basePath}/[id]`, id),
    delete: (id: string) => replaceId(deleteRoute || `${basePath}/[id]`, id),
    restore: (id: string) => replaceId(restoreRoute || `${basePath}/[id]/restore`, id),
    hardDelete: (id: string) => replaceId(hardDeleteRoute || `${basePath}/[id]/hard-delete`, id),
    bulk: bulkRoute || `${basePath}/bulk`,
    options: (params?: { column: string; search?: string; limit?: number }) => {
      const queryString = params ? buildQueryString(params) : ""
      return `${optionsRoute}${queryString ? `?${queryString}` : ""}`
    },
  }
}

