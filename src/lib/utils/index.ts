/**
 * Utils Barrel Export
 * Centralized exports for utility functions
 * 
 * NOTE: file-utils.ts is NOT exported here because it uses Node.js 'fs' module
 * and can only be used in server-side code. Import directly from "./file-utils"
 * in server components/API routes.
 */

export { cn } from "./cn"
export {
  parseJsonSafe,
  extractErrorMessage,
  extractAxiosErrorMessage,
  normalizeError,
  getErrorMessage,
} from "./api-utils"
export { getRouteFromFeature } from "./route-helpers"
export { generateSlug } from "./generate-slug"
export { deduplicateBy, deduplicateById, getDuplicateIds, arraysEqual } from "./array-helpers"
export { invalidateAndRefetchQueries, invalidateAndRefetchMultipleQueries } from "./query-helpers"
export { buildQueryString, withQuery } from "./query-utils"

