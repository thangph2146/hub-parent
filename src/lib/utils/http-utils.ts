/**
 * HTTP utility functions
 * Shared utilities for HTTP requests and responses
 */

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

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

/**
 * Apply basic security headers to response
 */
export const applyBasicSecurityHeaders = (response: NextResponse): NextResponse => {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  return response
}

/**
 * Apply Content Security Policy header
 */
export const applyCSPHeader = (response: NextResponse, csp?: string): NextResponse => {
  if (csp) {
    response.headers.set("Content-Security-Policy", csp)
  } else {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
  }
  return response
}

/**
 * Apply HSTS header for production
 */
export const applyHSTSHeader = (response: NextResponse): NextResponse => {
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
  return response
}

