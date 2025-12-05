/**
 * Uploads Permissions
 * Permissions constants cho uploads feature
 */

import { PERMISSIONS } from "@/lib/permissions"

/**
 * Uploads permissions
 */
export const UPLOADS_PERMISSIONS = {
  VIEW: PERMISSIONS.UPLOADS_VIEW,
  CREATE: PERMISSIONS.UPLOADS_CREATE,
  DELETE: PERMISSIONS.UPLOADS_DELETE,
  MANAGE: PERMISSIONS.UPLOADS_MANAGE,
} as const

/**
 * Permission arrays for different operations
 */
export const UPLOADS_PERMISSION_GROUPS = {
  // View and list operations
  VIEW: [UPLOADS_PERMISSIONS.VIEW, PERMISSIONS.POSTS_VIEW] as const,
  
  // Upload operations
  UPLOAD: [
    UPLOADS_PERMISSIONS.CREATE,
    PERMISSIONS.POSTS_CREATE,
    PERMISSIONS.POSTS_UPDATE,
    PERMISSIONS.POSTS_MANAGE,
    PERMISSIONS.POSTS_VIEW,
  ] as const,
  
  // Delete operations
  DELETE: [UPLOADS_PERMISSIONS.DELETE, UPLOADS_PERMISSIONS.MANAGE] as const,
  
  // Manage operations (full control)
  MANAGE: [UPLOADS_PERMISSIONS.MANAGE, PERMISSIONS.POSTS_MANAGE] as const,
} as const

