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

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: NextRequest): string {
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
 * Check if IP is in whitelist
 */
export function checkIPWhitelist(ip: string, allowedIPs: string[]): boolean {
  if (allowedIPs.length === 0) {
    return true
  }
  return allowedIPs.includes(ip)
}

/**
 * Check if request has maintenance bypass key
 */
export function checkMaintenanceMode(
  request: NextRequest,
  config: Pick<ProxyConfig, "maintenanceMode" | "maintenanceBypassKey">
): boolean {
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
export function handleCORS(
  request: NextRequest,
  allowedOrigins: string[]
): NextResponse | null {
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
export function handleMaintenanceMode(
  request: NextRequest,
  pathname: string,
  config: Pick<ProxyConfig, "maintenanceMode" | "maintenanceBypassKey">
): NextResponse | null {
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
export function handleIPWhitelist(
  request: NextRequest,
  pathname: string,
  allowedIPs: string[]
): NextResponse | null {
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
export function handleNextAuthRoutes(pathname: string): NextResponse | null {
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }
  
  return null
}

/**
 * Handle proxy API requests
 */
export function handleProxyRequests(
  request: NextRequest,
  pathname: string,
  externalApiBaseUrl: string
): NextResponse | null {
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
export function applySecurityHeaders(
  response: NextResponse,
  pathname: string,
  origin: string | null,
  allowedOrigins: string[]
): void {
  // Set pathname header for server components
  response.headers.set("x-pathname", pathname)
  
  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
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
export function handlePreflightRequest(
  request: NextRequest,
  response: NextResponse
): NextResponse | null {
  if (request.method === "OPTIONS") {
    return NextResponse.json(null, { status: 200, headers: response.headers })
  }
  
  return null
}

