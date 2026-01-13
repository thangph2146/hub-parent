import { queryKeys } from "@/constants"
import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { RoleRow } from "../types"
import { ROLE_MESSAGES } from "../constants"

export const useRoleActions = createResourceActionsHook<RoleRow>({
  resourceName: "roles",
  messages: ROLE_MESSAGES,
  getRecordName: (row) => row.displayName,
  getLogMetadata: (row) => ({ roleId: row.id, roleName: row.displayName }),
  customQueryKeys: {
    all: () => queryKeys.adminRoles.all(),
    detail: (id) => queryKeys.adminRoles.detail(id),
  },
  beforeSingleAction: async (action, row) => {
    if (row.name === "super_admin") {
      if (action === "delete" || action === "hard-delete") {
        return { 
          allowed: false, 
          message: action === "hard-delete" 
            ? ROLE_MESSAGES.CANNOT_HARD_DELETE_SUPER_ADMIN 
            : ROLE_MESSAGES.CANNOT_DELETE_SUPER_ADMIN 
        }
      }
      if (action === "unactive") {
        return { allowed: false, message: ROLE_MESSAGES.CANNOT_MODIFY_SUPER_ADMIN }
      }
    }
    return { allowed: true }
  },
  beforeBulkAction: async (action, ids, rows) => {
    if (!rows) return { allowed: true }

    const hasSuperAdmin = rows.some((row) => row.name === "super_admin")

    if (hasSuperAdmin) {
      if (action === "delete" || action === "hard-delete" || action === "unactive") {
        const targetIds = rows
          .filter((row) => row.name !== "super_admin")
          .map((row) => row.id)

        if (targetIds.length === 0) {
          const message = action === "unactive"
            ? ROLE_MESSAGES.CANNOT_MODIFY_SUPER_ADMIN
            : action === "hard-delete"
              ? ROLE_MESSAGES.CANNOT_HARD_DELETE_SUPER_ADMIN
              : ROLE_MESSAGES.CANNOT_DELETE_SUPER_ADMIN
          return { allowed: false, message }
        }

        return { allowed: true, targetIds }
      }
    }

    return { allowed: true }
  },
})
