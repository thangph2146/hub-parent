/**
 * Proxy Module Barrel Export
 * 
 * Export tất cả proxy-related utilities từ một nơi
 * Tuân thủ pattern của các modules khác trong lib/
 */

export { getProxyConfig, type ProxyConfig } from "./config"
export {
  getClientIP,
  checkIPWhitelist,
  checkMaintenanceMode,
  handleCORS,
  handleMaintenanceMode,
  handleIPWhitelist,
  handleNextAuthRoutes,
  handleProxyRequests,
  applySecurityHeaders,
  handlePreflightRequest,
} from "./middleware-handlers"

