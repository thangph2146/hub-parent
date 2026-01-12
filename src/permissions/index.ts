/**
 * Permissions Barrel Export
 * 
 * Export tất cả permissions related utilities từ một nơi
 */

// Core permissions definitions
export {
  RESOURCES,
  ACTIONS,
  PERMISSIONS,
  MENU_PERMISSIONS,
  DEFAULT_ROLES,
} from "@/constants/permissions"

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/lib/permissions"

// Re-export types
export type {
  Permission,
} from "@/constants/permissions"

// Permission helper functions
export {
  isSuperAdmin,
  isAdmin,
  isAdminOrSuperAdmin,
  canPerformAction,
  canPerformAnyAction,
} from "@/lib/permissions"

// Route configuration (single source of truth)
export { ROUTE_CONFIG, type HttpMethod, type RoutePermissionConfig } from "@/constants/routes"

// Route permissions mapping
export {
  ROUTE_PERMISSIONS,
  getRoutePermissions,
  requiresPermission,
} from "@/constants/page-permissions"

// API Route permissions mapping
export {
  API_ROUTE_PERMISSIONS,
  getApiRoutePermissions,
  requiresApiPermission,
} from "@/constants/api-permissions"

// Shared route helpers
export { 
  matchPattern, 
  normalizePathname,
  getPageRoutes,
  getResourceRoutes,
  getResourceMainRoute,
  getResourceCreateRoute,
  getResourceSubRoutes,
} from "@/lib/routes"

// API route generator functions
export {
  getApiRoutes,
  getResourceAdminApiRoutes,
  getResourceApiRoute,
  generateResourceApiRoutes,
} from "@/lib/api-route-mapping"

// Resource segment helpers
export {
  DEFAULT_RESOURCE_SEGMENT,
  getResourceSegmentForRoles,
  applyResourceSegmentToPath,
  toCanonicalResourcePath,
  replaceResourceSegment,
} from "@/lib/resource"
