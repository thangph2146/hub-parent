import { queryKeys } from "@/constants"
import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { UserRow } from "../types"
import { USER_MESSAGES, PROTECTED_SUPER_ADMIN_EMAIL } from "../constants"

export const useUserActions = createResourceActionsHook<UserRow>({
  resourceName: "users",
  messages: USER_MESSAGES,
  getRecordName: (row) => row.email,
  getLogMetadata: (row) => ({ userId: row.id, userEmail: row.email }),
  customQueryKeys: {
    all: () => queryKeys.adminUsers.all(),
    detail: (id) => queryKeys.adminUsers.detail(id),
  },
  beforeSingleAction: async (action, row) => {
    if ((action === "delete" || action === "hard-delete") && row.email === PROTECTED_SUPER_ADMIN_EMAIL) {
      return { allowed: false, message: USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN }
    }
    if (action === "unactive" && row.email === PROTECTED_SUPER_ADMIN_EMAIL) {
      return { allowed: false, message: USER_MESSAGES.CANNOT_DEACTIVATE_SUPER_ADMIN }
    }
    return { allowed: true }
  },
  beforeBulkAction: async (action, ids, rows) => {
    if (!rows) return { allowed: true }
    
    const hasSuperAdmin = rows.some((row) => row.email === PROTECTED_SUPER_ADMIN_EMAIL)
    
    if (hasSuperAdmin) {
      if (action === "delete" || action === "hard-delete" || action === "unactive") {
        const targetIds = rows
          .filter((row) => row.email !== PROTECTED_SUPER_ADMIN_EMAIL)
          .map((row) => row.id)
        
        if (targetIds.length === 0) {
          const message = action === "unactive" 
            ? USER_MESSAGES.CANNOT_DEACTIVATE_SUPER_ADMIN 
            : USER_MESSAGES.CANNOT_DELETE_SUPER_ADMIN
          return { allowed: false, message }
        }
        
        return { allowed: true, targetIds }
      }
    }
    
    return { allowed: true }
  },
})
