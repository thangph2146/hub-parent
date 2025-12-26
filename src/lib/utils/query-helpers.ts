/**
 * Query utility functions for TanStack Query
 * Shared across the application for consistent query invalidation and refetching
 */

import type { QueryClient, QueryKey } from "@tanstack/react-query"

/**
 * Invalidate and refetch queries with consistent options
 * This is a common pattern used throughout the app
 */
export const invalidateAndRefetchQueries = async (
  queryClient: QueryClient,
  queryKey: QueryKey,
  options?: {
    refetchType?: "active" | "all" | "none"
    type?: "active" | "all"
  }
): Promise<void> => {
  const refetchType = options?.refetchType ?? "all"
  const refetchQueryType = options?.type ?? "all"

  await queryClient.invalidateQueries({ queryKey, refetchType })
  await queryClient.refetchQueries({ queryKey, type: refetchQueryType })
}

/**
 * Invalidate and refetch multiple query keys
 */
export const invalidateAndRefetchMultipleQueries = async (
  queryClient: QueryClient,
  queryKeys: QueryKey[],
  options?: {
    refetchType?: "active" | "all" | "none"
    type?: "active" | "all"
  }
): Promise<void> => {
  await Promise.all(
    queryKeys.map((key) => invalidateAndRefetchQueries(queryClient, key, options))
  )
}

