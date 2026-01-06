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
      // Điều này giúp giảm số lần refetch không cần thiết
      // Data sẽ được cache trong 30 giây và chỉ refetch khi thực sự stale
      return queryClient.fetchQuery<DataTableResult<T>>({
        queryKey,
        queryFn: () => fetcher(params),
        ...ADMIN_QUERY_DEFAULTS,
      })
    },
    [queryClient, fetcher, buildParams, buildQueryKey],
  )
}


