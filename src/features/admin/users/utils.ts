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

export const validateEmail = (value: unknown): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof value !== "string" || !emailRegex.test(value)) {
    return { valid: false, error: "Email không hợp lệ" }
  }
  return { valid: true }
}

import { getUserInitials, validatePassword, formatDateVi } from "@/features/admin/resources/utils"

// Re-export common utilities from resources
export { getUserInitials, validatePassword, formatDateVi }

// User-specific validation (simpler than resources version)
export const validateName = (value: unknown): { valid: boolean; error?: string } => {
  if (value && typeof value === "string" && value.trim().length < 2) {
    return { valid: false, error: "Tên phải có ít nhất 2 ký tự" }
  }
  return { valid: true }
}

