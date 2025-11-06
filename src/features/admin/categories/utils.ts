/**
 * Shared utility functions và validation cho category forms
 */

import { formatDateVi, generateSlug, validateName, validateSlug, validateDescription } from "@/features/admin/resources/utils"

// Re-export common utilities from resources
export { formatDateVi, generateSlug, validateDescription }

// Category-specific validations (extend or override base validations)

/**
 * Validate category name (uses base validateName from resources)
 */
export function validateCategoryName(value: unknown): { valid: boolean; error?: string } {
  return validateName(value)
}

/**
 * Validate category slug (uses base validateSlug from resources)
 */
export function validateCategorySlug(value: unknown): { valid: boolean; error?: string } {
  return validateSlug(value)
}

