/**
 * Proxy Configuration
 * 
 * Centralized configuration cho proxy middleware
 * Tuân thủ Dependency Inversion Principle - config tách biệt khỏi handlers
 */

export interface ProxyConfig {
  /** Allowed origins for CORS */
  allowedOrigins: string[]
  /** Allowed IPs for admin routes */
  allowedIPs: string[]
  /** Maintenance mode enabled */
  maintenanceMode: boolean
  /** Maintenance bypass key */
  maintenanceBypassKey?: string
  /** External API base URL for proxy requests */
  externalApiBaseUrl: string
}

/**
 * Get proxy configuration from environment variables
 */
export function getProxyConfig(): ProxyConfig {
  return {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    allowedIPs: process.env.ALLOWED_IPS?.split(",") || [],
    maintenanceMode: process.env.MAINTENANCE_MODE === "true",
    maintenanceBypassKey: process.env.MAINTENANCE_BYPASS_KEY,
    externalApiBaseUrl:
      process.env.EXTERNAL_API_BASE_URL || "http://localhost:8000/api",
  }
}

