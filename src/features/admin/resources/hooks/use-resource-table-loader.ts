import { useCallback } from "react"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import type { ResourceTableLoader, ResourceViewMode } from "../types"
import { ADMIN_QUERY_DEFAULTS } from "../query-config"

interface UseResourceTableLoaderOptions<T extends object, P> {
  queryClient: QueryClient
  fetcher: (params: P) => Promise<DataTableResult<T>>
  buildParams: (input: { query: DataTableQueryState; view: ResourceViewMode<T> }) => P
  buildQueryKey: (params: P) => QueryKey
}

export const useResourceTableLoader = <T extends object, P>({
  queryClient,
  fetcher,
  buildParams,
  buildQueryKey,
}: UseResourceTableLoaderOptions<T, P>): ResourceTableLoader<T> => {
  return useCallback<ResourceTableLoader<T>>(
    async (query, view) => {
      const params = buildParams({ query, view })
      const queryKey = buildQueryKey(params)

      // Sử dụng fetchQuery với cache configuration từ ADMIN_QUERY_DEFAULTS
      // Admin luôn lấy dữ liệu mới nhất để tránh trường hợp dữ liệu không được cập nhật
      return queryClient.fetchQuery<DataTableResult<T>>({
        queryKey,
        queryFn: () => fetcher(params),
        ...ADMIN_QUERY_DEFAULTS,
      })
    },
    [queryClient, fetcher, buildParams, buildQueryKey],
  )
}


