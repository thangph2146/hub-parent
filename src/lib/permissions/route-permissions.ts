/**
 * Route Permissions Mapping
 * Map route paths với required permissions để check quyền truy cập
 */

import { PERMISSIONS } from "./permissions"
import type { Permission } from "./permissions"

export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Dashboard
  "/admin/dashboard": [PERMISSIONS.DASHBOARD_VIEW],
  "/admin/dashboard/stats": [PERMISSIONS.DASHBOARD_VIEW],

  // Users
  "/admin/users": [PERMISSIONS.USERS_VIEW],
  "/admin/users/new": [PERMISSIONS.USERS_CREATE],
  "/admin/users/[id]": [PERMISSIONS.USERS_VIEW],
  "/admin/users/[id]/edit": [PERMISSIONS.USERS_UPDATE],
  "/admin/users/roles": [PERMISSIONS.USERS_MANAGE],

  // Posts
  "/admin/posts": [PERMISSIONS.POSTS_VIEW],
  "/admin/posts/new": [PERMISSIONS.POSTS_CREATE],
  "/admin/posts/my-posts": [PERMISSIONS.POSTS_VIEW],
  "/admin/posts/published": [PERMISSIONS.POSTS_PUBLISH],
  "/admin/posts/[id]": [PERMISSIONS.POSTS_VIEW],
  "/admin/posts/[id]/edit": [PERMISSIONS.POSTS_UPDATE],

  // Categories
  "/admin/categories": [PERMISSIONS.CATEGORIES_VIEW],
  "/admin/categories/new": [PERMISSIONS.CATEGORIES_CREATE],
  "/admin/categories/[id]": [PERMISSIONS.CATEGORIES_VIEW],
  "/admin/categories/[id]/edit": [PERMISSIONS.CATEGORIES_UPDATE],

  // Tags
  "/admin/tags": [PERMISSIONS.TAGS_VIEW],
  "/admin/tags/new": [PERMISSIONS.TAGS_CREATE],
  "/admin/tags/[id]": [PERMISSIONS.TAGS_VIEW],
  "/admin/tags/[id]/edit": [PERMISSIONS.TAGS_UPDATE],

  // Comments
  "/admin/comments": [PERMISSIONS.COMMENTS_VIEW],
  "/admin/comments/pending": [PERMISSIONS.COMMENTS_APPROVE],

  // Roles
  "/admin/roles": [PERMISSIONS.ROLES_VIEW],
  "/admin/roles/new": [PERMISSIONS.ROLES_CREATE],
  "/admin/roles/[id]": [PERMISSIONS.ROLES_VIEW],
  "/admin/roles/[id]/edit": [PERMISSIONS.ROLES_UPDATE],

  // Messages
  "/admin/messages": [PERMISSIONS.MESSAGES_VIEW],
  "/admin/messages/inbox": [PERMISSIONS.MESSAGES_VIEW],
  "/admin/messages/sent": [PERMISSIONS.MESSAGES_VIEW],

  // Notifications
  "/admin/notifications": [PERMISSIONS.NOTIFICATIONS_VIEW],

  // Contact Requests
  "/admin/contact-requests": [PERMISSIONS.CONTACT_REQUESTS_VIEW],
  "/admin/contact-requests/resolved": [PERMISSIONS.CONTACT_REQUESTS_VIEW],
  "/admin/contact-requests/[id]": [PERMISSIONS.CONTACT_REQUESTS_VIEW],
  "/admin/contact-requests/[id]/edit": [PERMISSIONS.CONTACT_REQUESTS_UPDATE],

  // Students
  "/admin/students": [PERMISSIONS.STUDENTS_VIEW],
  "/admin/students/new": [PERMISSIONS.STUDENTS_CREATE],
  "/admin/students/[id]": [PERMISSIONS.STUDENTS_VIEW],
  "/admin/students/[id]/edit": [PERMISSIONS.STUDENTS_UPDATE],

  // Settings
  "/admin/settings": [PERMISSIONS.SETTINGS_VIEW],
  "/admin/settings/general": [PERMISSIONS.SETTINGS_VIEW],
  "/admin/settings/security": [PERMISSIONS.SETTINGS_MANAGE],
  "/admin/settings/notifications": [PERMISSIONS.SETTINGS_VIEW],
}

/**
 * Convert pattern to regex (e.g., "/admin/users/[id]" -> "^/admin/users/[^/]+$")
 */
function patternToRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, "[^/]+")
    .replace(/\//g, "\\/")
  return new RegExp(`^${regexPattern}$`)
}

/**
 * Get required permissions for a route path
 */
export function getRoutePermissions(pathname: string): Permission[] {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/"

  // Exact match
  if (ROUTE_PERMISSIONS[normalized]) {
    return ROUTE_PERMISSIONS[normalized]
  }

  // Pattern matching với dynamic segments
  for (const [pattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (patternToRegex(pattern).test(normalized)) {
      return permissions
    }
  }

  return []
}

/**
 * Check if a pathname requires any permissions
 */
export function requiresPermission(pathname: string): boolean {
  return getRoutePermissions(pathname).length > 0
}

