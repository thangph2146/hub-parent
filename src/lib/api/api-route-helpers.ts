/**
 * API Route Helpers
 * Shared utilities for Next.js API routes
 * Follows Next.js 16 best practices
 */

import { NextRequest, NextResponse } from "next/server"
import { ApplicationError, NotFoundError } from "@/features/admin/resources/server"
import type { ApiRouteContext } from "./types"
import { createErrorResponse, logger } from "@/lib/config"
import { normalizeError } from "@/lib/utils/api-utils"
import { sanitizeSearchQuery } from "./validation"

/**
 * Parse request body with error handling
 */
export const parseRequestBody = async (req: NextRequest): Promise<Record<string, unknown>> => {
  try {
    return await req.json()
  } catch {
    throw new ApplicationError("Dữ liệu không hợp lệ", 400)
  }
}

/**
 * Extract params from dynamic route args
 */
export const extractParams = async <T extends Record<string, string>>(
  args: unknown[]
): Promise<T> => {
  const { params } = (args[0] as { params: Promise<T> }) || {}
  if (!params) throw new ApplicationError("Invalid route parameters", 400)
  return await params
}

/**
 * Get user ID from context
 */
export const getUserId = (context: ApiRouteContext): string => {
  const userId = context.session?.user?.id
  if (!userId) throw new ApplicationError("Unauthorized", 401)
  return userId
}

/**
 * Create auth context for mutations
 */
export const createAuthContext = (context: ApiRouteContext, userId: string) => ({
  actorId: userId,
  permissions: context.permissions,
  roles: context.roles,
})

/**
 * Handle API errors with proper response
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string,
  defaultStatus = 500
) => {
  if (error instanceof ApplicationError) {
    return createErrorResponse(error.message, { status: error.status || defaultStatus })
  }
  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, { status: 404 })
  }
  logger.error("API error", normalizeError(error))
  return createErrorResponse(defaultMessage, { status: defaultStatus })
}

/**
 * Validate required fields
 */
export const validateRequired = (body: Record<string, unknown>, fields: string[]): void => {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      throw new ApplicationError(`${field} là bắt buộc`, 400)
    }
  }
}

/**
 * Extract string value from body
 */
export const getStringValue = (body: Record<string, unknown>, key: string): string | undefined =>
  typeof body[key] === "string" ? body[key] : undefined

/**
 * Extract array value from body
 */
export const getArrayValue = <T>(
  body: Record<string, unknown>,
  key: string,
  validator?: (item: unknown) => item is T
): T[] => {
  if (!Array.isArray(body[key])) return []
  return validator ? body[key].filter(validator) : (body[key] as T[])
}

/**
 * Options Route Configuration
 * Helper function để tạo options API route handler
 * Đảm bảo consistency và tối ưu hóa theo chuẩn Next.js 16
 */
export interface OptionsRouteConfig {
  allowedColumns: string[]
  getOptions: (column: string, search?: string, limit?: number) => Promise<Array<{ label: string; value: string }>>
}

/**
 * Tạo options API route handler với validation và caching
 * 
 * @param req - NextRequest
 * @param config - Configuration cho options route
 * @returns NextResponse với options data hoặc error
 */
export const createOptionsHandler = async (
  req: NextRequest,
  config: OptionsRouteConfig
): Promise<NextResponse> => {
  const searchParams = req.nextUrl.searchParams
  const column = searchParams.get("column")
  const search = searchParams.get("search") || ""
  const limitParam = searchParams.get("limit")

  // Validate column parameter
  if (!column) {
    return createErrorResponse("Column parameter is required", { status: 400 })
  }

  // Validate column (whitelist allowed columns)
  if (!config.allowedColumns.includes(column)) {
    return createErrorResponse(
      `Column '${column}' is not allowed. Allowed columns: ${config.allowedColumns.join(", ")}`,
      { status: 400 }
    )
  }

  // Validate and sanitize search query (không giới hạn độ dài)
  const searchValidation = sanitizeSearchQuery(search, Infinity)
  const searchValue = searchValidation.valid ? searchValidation.value : undefined

  // Validate limit
  const limit = limitParam ? parseInt(limitParam, 10) : 50
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return createErrorResponse("Limit must be between 1 and 100", { status: 400 })
  }

  try {
    const options = await config.getOptions(column, searchValue, limit)
    
    // Create response with caching headers
    // Cache for 30 seconds để optimize performance nhưng vẫn đảm bảo data fresh
    // Theo Next.js 16: https://nextjs.org/docs/app/building-your-application/caching
    const response = NextResponse.json({ data: options })
    
    // Set cache headers theo Next.js 16 best practices
    // - private: Chỉ cache ở client, không cache ở shared CDN (vì có authentication)
    // - s-maxage=30: Cache ở edge/CDN trong 30 giây
    // - stale-while-revalidate=60: Serve stale content trong 60s khi đang revalidate
    // Sử dụng short-term cache vì data có thể thay đổi và có search query
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=30, stale-while-revalidate=60"
    )
    
    return response
  } catch (error) {
    logger.error(
      `Error fetching filter options for column '${column}'`,
      normalizeError(error)
    )
    
    return createErrorResponse("Đã xảy ra lỗi khi lấy danh sách tùy chọn", { status: 500 })
  }
}
