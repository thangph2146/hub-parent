/**
 * API Path Helpers
 */
import { apiPathConfig } from "@/constants/api"

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

const ensureLeadingSlash = (path: string): string => {
  if (!path) return "/"
  return path.startsWith("/") ? path : `/${path}`
}

const isAbsoluteUrl = (path: string): boolean => ABSOLUTE_URL_PATTERN.test(path)

/**
 * Thêm `/api` prefix cho relative path.
 */
export const withApiBase = (path: string): string => {
  if (!path) {
    return apiPathConfig.basePath
  }
  if (isAbsoluteUrl(path)) {
    return path
  }
  const normalized = ensureLeadingSlash(path)
  if (normalized.startsWith(apiPathConfig.basePath)) {
    return normalized
  }
  return `${apiPathConfig.basePath}${normalized}`
}

/**
 * Thêm `/api/admin` prefix cho các admin relative path.
 */
export const withAdminApiBase = (path: string): string => {
  if (!path) {
    return apiPathConfig.adminBasePath
  }
  if (isAbsoluteUrl(path)) {
    return path
  }
  const normalized = ensureLeadingSlash(path)
  if (normalized.startsWith(apiPathConfig.adminBasePath)) {
    return normalized
  }
  if (normalized.startsWith("/admin")) {
    return `${apiPathConfig.basePath}${normalized}`
  }
  return `${apiPathConfig.adminBasePath}${normalized}`
}

/**
 * Bỏ `/api` prefix.
 */
export const stripApiBase = (path: string): string => {
  if (!path || isAbsoluteUrl(path)) {
    return path
  }
  if (!path.startsWith(apiPathConfig.basePath)) {
    return ensureLeadingSlash(path)
  }
  const stripped = path.slice(apiPathConfig.basePath.length) || "/"
  return ensureLeadingSlash(stripped)
}

/**
 * Bỏ `/api/admin` prefix.
 */
export const stripAdminApiBase = (path: string): string => {
  if (!path || isAbsoluteUrl(path)) {
    return path
  }
  const normalized = ensureLeadingSlash(path)
  if (normalized.startsWith(apiPathConfig.adminBasePath)) {
    const stripped = normalized.slice(apiPathConfig.adminBasePath.length) || "/"
    return ensureLeadingSlash(stripped)
  }
  return stripApiBase(normalized)
}
