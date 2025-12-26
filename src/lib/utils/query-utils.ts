/**
 * Query string utility functions
 */

/**
 * Build query string from params
 */
export const buildQueryString = (params: Record<string, string | number | boolean | undefined>): string => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  })
  return searchParams.toString()
}

/**
 * Append query string to path
 */
export const withQuery = (
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string => {
  if (!params) return path
  const queryString = buildQueryString(params)
  return queryString ? `${path}?${queryString}` : path
}

