/**
 * Constants for public post features
 */

export const POST_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const

export const POST_SORT_OPTIONS = {
  NEWEST: "newest",
  OLDEST: "oldest",
} as const

export type PostSortOption = typeof POST_SORT_OPTIONS[keyof typeof POST_SORT_OPTIONS]

export const POST_SEARCH = {
  MAX_LENGTH: 200,
} as const

