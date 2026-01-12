import { getUserInitials, validatePassword, formatDateVi, validateName, validateEmail } from "@/features/admin/resources/utils"

// Re-export common utilities from resources
export { getUserInitials, validatePassword, formatDateVi, validateName, validateEmail }

export interface Role {
  id: string
  name: string
  displayName: string
}

export const normalizeRoleIds = (roleIds: unknown): string[] => {
  if (roleIds === undefined || roleIds === null || roleIds === "") return []
  if (Array.isArray(roleIds)) return roleIds.filter((id): id is string => typeof id === "string" && id !== "")
  if (typeof roleIds === "string" && roleIds !== "") return [roleIds]
  return []
}

