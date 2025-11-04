/**
 * API Route Permissions Mapping
 * Map API routes với required permissions để tự động check quyền truy cập
 */

import { PERMISSIONS } from "./permissions"
import type { Permission } from "./permissions"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

/**
 * API Route permissions mapping
 * Key format: "METHOD /api/path" (e.g., "GET /api/users", "POST /api/users")
 */
export const API_ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Users API
  "GET /api/users": [PERMISSIONS.USERS_VIEW],
  "POST /api/users": [PERMISSIONS.USERS_CREATE],
  "GET /api/users/[id]": [PERMISSIONS.USERS_VIEW],
  "PUT /api/users/[id]": [PERMISSIONS.USERS_UPDATE],
  "DELETE /api/users/[id]": [PERMISSIONS.USERS_DELETE],
  "POST /api/users/bulk": [PERMISSIONS.USERS_MANAGE],
  "POST /api/users/[id]/restore": [PERMISSIONS.USERS_UPDATE],
  "DELETE /api/users/[id]/hard-delete": [PERMISSIONS.USERS_MANAGE],

  // Roles API
  "GET /api/roles": [
    PERMISSIONS.ROLES_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_VIEW,
  ],

  // Notifications API
  "GET /api/notifications": [PERMISSIONS.NOTIFICATIONS_VIEW],
  "POST /api/notifications": [PERMISSIONS.NOTIFICATIONS_MANAGE],
  "GET /api/notifications/[id]": [PERMISSIONS.NOTIFICATIONS_VIEW],
  "PUT /api/notifications/[id]": [PERMISSIONS.NOTIFICATIONS_MANAGE],
  "DELETE /api/notifications/[id]": [PERMISSIONS.NOTIFICATIONS_MANAGE],
  "POST /api/notifications/mark-all-read": [PERMISSIONS.NOTIFICATIONS_VIEW],

  // Posts API
  "GET /api/posts": [PERMISSIONS.POSTS_VIEW],
  "POST /api/posts": [PERMISSIONS.POSTS_CREATE],
  "GET /api/posts/[id]": [PERMISSIONS.POSTS_VIEW],
  "PUT /api/posts/[id]": [PERMISSIONS.POSTS_UPDATE],
  "DELETE /api/posts/[id]": [PERMISSIONS.POSTS_DELETE],

  // Categories API
  "GET /api/categories": [PERMISSIONS.CATEGORIES_VIEW],
  "POST /api/categories": [PERMISSIONS.CATEGORIES_CREATE],
  "GET /api/categories/[id]": [PERMISSIONS.CATEGORIES_VIEW],
  "PUT /api/categories/[id]": [PERMISSIONS.CATEGORIES_UPDATE],
  "DELETE /api/categories/[id]": [PERMISSIONS.CATEGORIES_DELETE],

  // Tags API
  "GET /api/tags": [PERMISSIONS.TAGS_VIEW],
  "POST /api/tags": [PERMISSIONS.TAGS_CREATE],
  "GET /api/tags/[id]": [PERMISSIONS.TAGS_VIEW],
  "PUT /api/tags/[id]": [PERMISSIONS.TAGS_UPDATE],
  "DELETE /api/tags/[id]": [PERMISSIONS.TAGS_DELETE],

  // Comments API
  "GET /api/comments": [PERMISSIONS.COMMENTS_VIEW],
  "POST /api/comments/[id]/approve": [PERMISSIONS.COMMENTS_APPROVE],
  "DELETE /api/comments/[id]": [PERMISSIONS.COMMENTS_DELETE],

  // Contact Requests API
  "GET /api/contact-requests": [PERMISSIONS.CONTACT_REQUESTS_VIEW],
  "PUT /api/contact-requests/[id]": [PERMISSIONS.CONTACT_REQUESTS_UPDATE],
  "POST /api/contact-requests/[id]/assign": [PERMISSIONS.CONTACT_REQUESTS_ASSIGN],

  // Students API
  "GET /api/students": [PERMISSIONS.STUDENTS_VIEW],
  "POST /api/students": [PERMISSIONS.STUDENTS_CREATE],
  "GET /api/students/[id]": [PERMISSIONS.STUDENTS_VIEW],
  "PUT /api/students/[id]": [PERMISSIONS.STUDENTS_UPDATE],
  "DELETE /api/students/[id]": [PERMISSIONS.STUDENTS_DELETE],

  // Settings API
  "GET /api/settings": [PERMISSIONS.SETTINGS_VIEW],
  "PUT /api/settings": [PERMISSIONS.SETTINGS_UPDATE],
}

/**
 * Convert pattern to regex (e.g., "/api/users/[id]" -> "^/api/users/[^/]+$")
 */
function patternToRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, "[^/]+")
    .replace(/\//g, "\\/")
  return new RegExp(`^${regexPattern}$`)
}

/**
 * Match pattern với pathname
 */
function matchPattern(pattern: string, pathname: string): boolean {
  return patternToRegex(pattern).test(pathname)
}

/**
 * Get required permissions for an API route
 */
export function getApiRoutePermissions(
  pathname: string,
  method: HttpMethod
): Permission[] {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/"
  const exactKey = `${method} ${normalized}`

  // Exact match
  if (API_ROUTE_PERMISSIONS[exactKey]) {
    return API_ROUTE_PERMISSIONS[exactKey]
  }

  // Pattern matching với dynamic segments
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
export function requiresApiPermission(pathname: string, method: HttpMethod): boolean {
  return getApiRoutePermissions(pathname, method).length > 0
}
