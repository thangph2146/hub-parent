/**
 * Route Params Validation Utilities
 * 
 * Helper functions để validate route params theo chuẩn Next.js 16
 * Đảm bảo security và type safety cho dynamic routes
 */

import { validateID } from "@/utils"

/**
 * Validate and extract ID from route params (Next.js 16 async params)
 * 
 * @param params - Route params Promise (Next.js 16 format)
 * @param paramName - Name of the param to extract (default: "id")
 * @returns Validated ID hoặc null nếu invalid
 */
export const extractRouteId = async (
  params: Promise<Record<string, unknown>>,
  paramName: string = "id"
): Promise<string | null> => {
  const resolvedParams = await params
  const value = resolvedParams[paramName]

  if (typeof value !== "string") {
    return null
  }

  const validation = validateID(value)
  if (!validation.valid) {
    return null
  }

  return value.trim()
}

/**
 * Validate route ID and return not found response if invalid
 * 
 * @param id - ID from route params
 * @param _resourceName - Name of the resource (for error message, reserved for future use)
 * @returns Validated ID hoặc null nếu invalid
 */
export const validateRouteId = (id: string | null, _resourceName: string = "Tài nguyên"): string | null => {
  if (!id || !validateID(id).valid) return null
  return id.trim()
}
