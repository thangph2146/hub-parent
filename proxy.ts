/**
 * Next.js 16 Proxy
 * 
 * Tài liệu chính thức:
 * - https://nextjs.org/docs/app/getting-started/proxy
 * - https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 * - https://nextjs.org/docs/app/guides/upgrading/codemods#middleware-to-proxy
 * 
 * RUNTIME: Edge Runtime (mặc định)
 * 
 * Theo tài liệu Next.js 16 chính thức:
 * - Proxy mặc định chạy ở Edge Runtime
 * - Edge Runtime = Vercel Edge Network, Cloudflare Workers, hoặc edge servers
 * - Chạy ở network boundary, gần client hơn (lower latency)
 * - Chạy trước khi request được hoàn thành (before request is completed)
 * - Từ Next.js 15.5.0+ có thể config runtime: 'nodejs' (NHƯNG không được khuyến nghị)
 * - Edge Runtime được khuyến nghị cho redirects, rewrites, và request modifications
 * 
 * Use cases của Proxy (theo Next.js docs):
 * - Quick redirects after reading parts of the incoming request
 * - Rewriting to different pages based on A/B tests or experiments
 * - Modifying headers for all pages or a subset of pages
 * - KHÔNG nên dùng cho slow data fetching
 * - KHÔNG nên dùng như full session management solution
 * 
 * Hạn chế của Edge Runtime:
 * - Không có access đến Node.js APIs (fs, crypto, child_process, etc.)
 * - Không thể dùng Node.js-only packages (bcrypt, prisma client, database drivers, etc.)
 * - Chỉ có thể dùng Web APIs (fetch, URL, Headers, etc.) và Edge-compatible packages
 * - Không thể validate JWT token trực tiếp (cần Node.js runtime)
 * - Using fetch with cache options has no effect in Proxy
 * 
 * Migration từ Middleware (Next.js 16):
 * - Next.js 16 đã đổi tên "middleware" thành "proxy"
 * - Codemod: npx @next/codemod@canary middleware-to-proxy .
 * - File convention: proxy.ts hoặc src/proxy.ts (ở root hoặc src, cùng level với pages/app)
 * - Function name: export function proxy() (không phải middleware())
 * - Chỉ được phép 1 file proxy.ts per project (nhưng có thể organize logic vào modules)
 * - Lý do: Tránh nhầm lẫn với Express.js middleware, làm rõ mục đích là network proxy
 * 
 * Chức năng:
 * - CORS validation
 * - Maintenance mode check
 * - IP whitelist cho admin routes
 * - Proxy API requests
 * - Security headers
 * - Static asset caching
 * 
 * Note: Authentication redirects được xử lý bởi PermissionGateClient ở client-side
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "@/lib/config"
import { getProxyConfig } from "@/lib/proxy/config"
import {
  handleCORS,
  handleMaintenanceMode,
  handleIPWhitelist,
  handleNextAuthRoutes,
  handleProxyRequests,
  applySecurityHeaders,
  handlePreflightRequest,
} from "@/lib/proxy/middleware-handlers"

/**
 * Main proxy function - orchestrates all middleware handlers
 * Follows Single Responsibility: Each handler has one responsibility
 * Follows Dependency Inversion: Config injected via getProxyConfig()
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const origin = request.headers.get("origin")
  
  // Get configuration (Dependency Inversion Principle)
  const config = getProxyConfig()

  // 1. CORS Check
  const corsResponse = handleCORS(request, config.allowedOrigins)
  if (corsResponse) return corsResponse

  // 2. Maintenance Mode Check
  const maintenanceResponse = handleMaintenanceMode(request, pathname, {
    maintenanceMode: config.maintenanceMode,
    maintenanceBypassKey: config.maintenanceBypassKey,
  })
  if (maintenanceResponse) return maintenanceResponse

  // 3. IP Whitelist Check for Admin Routes
  const ipWhitelistResponse = handleIPWhitelist(request, pathname, config.allowedIPs)
  if (ipWhitelistResponse) return ipWhitelistResponse

  // 4. Skip proxy for NextAuth routes
  const nextAuthResponse = handleNextAuthRoutes(pathname)
  if (nextAuthResponse) return nextAuthResponse

  // 5. Proxy API requests
  const proxyResponse = handleProxyRequests(request, pathname, config.externalApiBaseUrl)
  if (proxyResponse) return proxyResponse

  // 6. Apply security headers and continue
  const response = NextResponse.next()
  applySecurityHeaders(response, pathname, origin, config.allowedOrigins)

  // 7. Handle preflight requests
  const preflightResponse = handlePreflightRequest(request, response)
  if (preflightResponse) return preflightResponse

  // 8. Development Mode Logging
  logger.debug("Proxy processing request", {
    method: request.method,
    pathname,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
  })

  return response
}

/**
 * Proxy Configuration
 * 
 * Theo tài liệu Next.js 16: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 * 
 * RUNTIME:
 * - Mặc định: Edge Runtime (không cần khai báo)
 * - Có thể config runtime: 'nodejs' (từ Next.js 15.5.0+)
 * - Nhưng Edge Runtime được khuyến nghị vì:
 *   + Chạy gần client hơn (lower latency)
 *   + Tốt hơn cho redirects và request modifications
 *   + Không cần Node.js APIs trong trường hợp này
 * 
 * MATCHER:
 * - Chỉ định các routes mà Proxy sẽ chạy
 * - Hỗ trợ regex patterns và negative lookaheads
 * - Xem thêm: https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  // Runtime mặc định là 'edge' trong Next.js 16
  // Không cần khai báo runtime: 'edge' vì đây là mặc định
  // Nếu cần Node.js APIs, có thể thêm: runtime: 'nodejs' (từ Next.js 15.5.0+)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
