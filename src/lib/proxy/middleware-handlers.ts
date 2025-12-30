/**
 * Proxy Middleware Handlers
 * 
 * Tách các handlers theo Single Responsibility Principle
 * Mỗi handler chỉ chịu trách nhiệm cho một nhiệm vụ cụ thể
 * 
 * Tuân thủ Dependency Inversion Principle - nhận config qua parameters
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { ProxyConfig } from "./config"
import { getClientIP as getClientIPUtil, applyBasicSecurityHeaders } from "@/lib/utils/http-utils"

/**
 * Get client IP address from request headers
 * Re-export for backward compatibility
 */
export const getClientIP = getClientIPUtil

/**
 * Check if IP is in whitelist
 */
export const checkIPWhitelist = (ip: string, allowedIPs: string[]): boolean =>
  allowedIPs.length === 0 || allowedIPs.includes(ip)

/**
 * Check if request has maintenance bypass key
 */
export const checkMaintenanceMode = (
  request: NextRequest,
  config: Pick<ProxyConfig, "maintenanceMode" | "maintenanceBypassKey">
): boolean => {
  if (!config.maintenanceMode) {
    return false
  }

  const bypassKey =
    request.headers.get("x-maintenance-bypass") ||
    new URL(request.url).searchParams.get("bypass")

  return bypassKey === config.maintenanceBypassKey
}

/**
 * Handle CORS validation
 */
export const handleCORS = (
  request: NextRequest,
  allowedOrigins: string[]
): NextResponse | null => {
  const origin = request.headers.get("origin")
  
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: "Origin not allowed" },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Handle maintenance mode check
 */
export const handleMaintenanceMode = (
  request: NextRequest,
  pathname: string,
  config: Pick<ProxyConfig, "maintenanceMode" | "maintenanceBypassKey">
): NextResponse | null => {
  if (config.maintenanceMode && !checkMaintenanceMode(request, config)) {
    const isApiRoute = pathname.startsWith("/api")
    if (isApiRoute) {
      return NextResponse.json(
        {
          error: "Maintenance mode is enabled",
          message: "The system is currently under maintenance",
        },
        { status: 503 }
      )
    }
    return NextResponse.redirect(new URL("/maintenance", request.url))
  }
  
  return null
}

/**
 * Handle IP whitelist check for admin routes
 */
export const handleIPWhitelist = (
  request: NextRequest,
  pathname: string,
  allowedIPs: string[]
): NextResponse | null => {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const clientIP = getClientIP(request)
    if (!checkIPWhitelist(clientIP, allowedIPs)) {
      return NextResponse.json(
        { error: "IP address not allowed" },
        { status: 403 }
      )
    }
  }
  
  return null
}

/**
 * Handle NextAuth routes (skip proxy)
 */
export const handleNextAuthRoutes = (pathname: string): NextResponse | null =>
  pathname.startsWith("/api/auth") ? NextResponse.next() : null

/**
 * Handle proxy API requests
 */
export const handleProxyRequests = (
  request: NextRequest,
  pathname: string,
  externalApiBaseUrl: string
): NextResponse | null => {
  if (pathname.startsWith("/api/proxy/")) {
    const proxyPath = pathname.replace("/api/proxy/", "")
    const queryString = request.nextUrl.search
    const targetUrl = new URL(`${externalApiBaseUrl}/${proxyPath}${queryString}`)
    
    return NextResponse.rewrite(targetUrl)
  }
  
  return null
}

/**
 * Apply security headers to response
 */
export const applySecurityHeaders = (
  response: NextResponse,
  pathname: string,
  origin: string | null,
  allowedOrigins: string[]
): void => {
  // Set pathname header for server components
  response.headers.set("x-pathname", pathname)
  
  // Security headers
  applyBasicSecurityHeaders(response)
  response.headers.set("Referrer-Policy", "origin-when-cross-origin")
  response.headers.set("X-DNS-Prefetch-Control", "on")

  // CORS headers for API routes
  if (pathname.startsWith("/api")) {
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    } else {
      response.headers.set("Access-Control-Allow-Origin", "*")
    }
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    )
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    )
  }

  // Static asset caching
  if (pathname.startsWith("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    )
  }
}

/**
 * Handle preflight OPTIONS requests
 */
export const handlePreflightRequest = (
  request: NextRequest,
  response: NextResponse
): NextResponse | null =>
  request.method === "OPTIONS"
    ? NextResponse.json(null, { status: 200, headers: response.headers })
    : null

