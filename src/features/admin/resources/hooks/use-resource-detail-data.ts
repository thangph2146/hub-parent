/**
 * Hook để sử dụng React Query cache cho detail data với fallback về Server Component props
 * Đảm bảo detail page hiển thị dữ liệu mới nhất từ React Query cache sau khi edit
 */

import { useMemo } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { QueryKey } from "@tanstack/react-query"

interface UseResourceDetailDataOptions<T> {
  /**
   * Initial data từ Server Component props
   */
  initialData: T
  /**
   * Resource ID
   */
  resourceId: string
  /**
   * Query key function để lấy detail data từ React Query cache
   */
  detailQueryKey: (id: string) => QueryKey
  /**
   * Resource name để logging
   */
  resourceName?: string
}

/**
 * Hook để sử dụng React Query cache cho detail data
 * Ưu tiên React Query cache nếu có, fallback về initial data từ Server Component
 * 
 * @example
 * ```tsx
 * const detailData = useResourceDetailData({
 *   initialData: category,
 *   resourceId: categoryId,
 *   detailQueryKey: queryKeys.adminCategories.detail,
 *   resourceName: "categories",
 * })
 * ```
 */
export function useResourceDetailData<T extends Record<string, unknown>>({
  initialData,
  resourceId,
  detailQueryKey,
  resourceName = "resource",
}: UseResourceDetailDataOptions<T>): T {
  const queryClient = useQueryClient()

  // Ưu tiên sử dụng React Query cache nếu có, fallback về initial data
  const detailData = useMemo(() => {
    const queryKey = detailQueryKey(resourceId)
    const cachedData = queryClient.getQueryData<{ data: T }>(queryKey)

    // Nếu có data trong React Query cache, sử dụng nó (ưu tiên dữ liệu mới nhất)
    return cachedData?.data ?? initialData
  }, [queryClient, resourceId, detailQueryKey, initialData])

  return detailData
}

