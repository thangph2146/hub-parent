/**
 * Request utility functions
 * Shared utilities for extracting information from HTTP requests
 */

import type { NextRequest } from "next/server"

/**
 * Get client IP address from request headers
 * Checks multiple headers in order: x-forwarded-for, x-real-ip, cf-connecting-ip
 */
export const getClientIP = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  return "unknown"
}

