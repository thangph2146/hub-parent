/**
 * External API Client - Gọi các API ngoài
 * Sử dụng để gọi các API từ hệ thống khác (ví dụ: API điểm số từ parentapi.hub.edu.vn)
 */

import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from "axios"
import { logger } from "@/lib/config"
import { extractAxiosErrorMessage } from "@/lib/utils"

// Base URL cho external API - có thể override qua env variable
const EXTERNAL_API_URL =
  process.env.EXTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_EXTERNAL_API_URL ||
  "https://parentapi.hub.edu.vn"

if (!EXTERNAL_API_URL) {
  logger.warn("EXTERNAL_API_URL not configured, external API calls will fail")
} else {
  logger.debug("External API URL configured", { url: EXTERNAL_API_URL })
}

// Tạo axios instance cho external API
const externalApiClient = axios.create({
  baseURL: EXTERNAL_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - thêm auth headers với token từ env variable
externalApiClient.interceptors.request.use(
  (config) => {
    const requestUrl = config.url || "unknown"
    const fullUrl = config.baseURL ? `${config.baseURL}${requestUrl}` : requestUrl

    logger.info("[External API] Request interceptor triggered", {
      url: fullUrl,
      method: config.method?.toUpperCase(),
    })

    // Chỉ sử dụng token từ env variable
    const externalApiToken = process.env.EXTERNAL_API_TOKEN
    if (externalApiToken) {
      logger.info("[External API] Using token from EXTERNAL_API_TOKEN env variable", {
        url: fullUrl,
        tokenPreview: externalApiToken.substring(0, 20) + "...",
      })
      config.headers.Authorization = `Bearer ${externalApiToken}`
    } else {
      logger.warn("[External API] EXTERNAL_API_TOKEN not configured, request may fail", {
        url: fullUrl,
      })
    }

    // Log toàn bộ request headers trước khi gửi (để debug)
    const authHeader = config.headers.Authorization
    const authHeaderStr = typeof authHeader === "string" 
      ? `${authHeader.substring(0, 30)}...` 
      : authHeader 
        ? String(authHeader).substring(0, 30) + "..." 
        : "not set"
    
    logger.info("[External API] Request headers before sending", {
      url: fullUrl,
      method: config.method?.toUpperCase(),
      headers: {
        Authorization: authHeaderStr,
        Accept: config.headers.Accept || "not set",
        "Content-Type": config.headers["Content-Type"] || "not set",
        "User-Agent": config.headers["User-Agent"] || "not set",
      },
      hasData: !!config.data,
    })

    return config
  },
  (error) => {
    logger.error("[External API] Request interceptor error", {
      error: error instanceof Error ? error.message : String(error),
    })
    return Promise.reject(error)
  }
)

// Response interceptor - xử lý errors
externalApiClient.interceptors.response.use(
  (response) => {
    const requestUrl = response.config?.url || "unknown"
    const fullUrl = response.config?.baseURL 
      ? `${response.config.baseURL}${requestUrl}` 
      : requestUrl

    logger.info("[External API] Response received", {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
    })
    return response
  },
  (error) => {
    const requestUrl = error.config?.url || "unknown"
    const fullUrl = error.config?.baseURL 
      ? `${error.config.baseURL}${requestUrl}` 
      : requestUrl

    // Format response data để log
    let responseDataStr = ""
    if (error.response?.data) {
      try {
        if (typeof error.response.data === "string") {
          responseDataStr = error.response.data.substring(0, 500) // Limit length
        } else {
          responseDataStr = JSON.stringify(error.response.data, null, 2).substring(0, 500)
        }
      } catch {
        responseDataStr = String(error.response.data).substring(0, 500)
      }
    }

    // Log toàn bộ response headers nếu có
    const responseHeaders = error.response?.headers ? {
      contentType: error.response.headers["content-type"],
      contentLength: error.response.headers["content-length"],
      allHeaders: Object.keys(error.response.headers).reduce((acc, key) => {
        acc[key] = String(error.response.headers[key]).substring(0, 100)
        return acc
      }, {} as Record<string, string>),
    } : undefined

    logger.error("[External API] Response error", {
      url: fullUrl,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: extractAxiosErrorMessage(error),
      responseData: responseDataStr || (error.response?.data ? String(error.response.data) : ""),
      responseHeaders,
      requestHeaders: error.config?.headers ? {
        authorization: error.config.headers.Authorization 
          ? (typeof error.config.headers.Authorization === "string"
              ? `${error.config.headers.Authorization.substring(0, 30)}...`
              : String(error.config.headers.Authorization).substring(0, 30) + "...")
          : "not set",
        accept: error.config.headers.Accept,
        contentType: error.config.headers["Content-Type"],
        allHeaders: Object.keys(error.config.headers).reduce((acc, key) => {
          const value = error.config.headers[key]
          if (typeof value === "string") {
            acc[key] = key.toLowerCase().includes("authorization") 
              ? `${value.substring(0, 30)}...` 
              : value.substring(0, 100)
          } else {
            acc[key] = String(value).substring(0, 100)
          }
          return acc
        }, {} as Record<string, string>),
      } : undefined,
    })
    return Promise.reject(error)
  }
)

/**
 * Gọi external API và trả về data hoặc throw error
 * @param endpoint - API endpoint (ví dụ: /api/Scores/detailed/123)
 * @param options - Options cho request
 */
export const callExternalApi = async <T = unknown>(
  endpoint: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE"
    data?: unknown
    headers?: Record<string, string>
  }
): Promise<T> => {
  const fullUrl = `${EXTERNAL_API_URL}${endpoint}`

  logger.info("[External API] callExternalApi called", {
    endpoint,
    fullUrl,
    method: options?.method || "GET",
    hasData: !!options?.data,
  })

  if (!EXTERNAL_API_URL) {
    logger.error("[External API] EXTERNAL_API_URL not configured")
    throw new Error("EXTERNAL_API_URL not configured")
  }

  try {
    const headers: AxiosRequestHeaders = {} as AxiosRequestHeaders
    if (options?.headers) {
      Object.keys(options.headers).forEach((key) => {
        headers[key] = options.headers![key]
      })
    }

    const config: InternalAxiosRequestConfig = {
      url: endpoint,
      method: options?.method || "GET",
      data: options?.data,
      headers,
    }

    logger.info("[External API] Making request", {
      endpoint,
      fullUrl,
      method: config.method,
    })

    const response = await externalApiClient.request<T>(config)

    logger.info("[External API] Request successful", {
      endpoint,
      fullUrl,
      status: response.status,
      hasData: !!response.data,
    })

    return response.data
  } catch (error) {
    logger.error("[External API] Request failed", {
      endpoint,
      fullUrl,
      method: options?.method || "GET",
      error: extractAxiosErrorMessage(error),
      errorDetails: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      } : String(error),
    })
    throw error
  }
}

export default externalApiClient

