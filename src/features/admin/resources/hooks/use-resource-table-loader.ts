import { useCallback } from "react"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { DataTableQueryState, DataTableResult } from "@/components/tables"
import type { ResourceTableLoader, ResourceViewMode } from "../types"

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

      // Remove query khỏi cache để đảm bảo luôn fetch fresh data từ server
      // Điều này đảm bảo data luôn được cập nhật sau khi actions thành công
      queryClient.removeQueries({ queryKey })
      
      // Luôn fetch fresh data từ server, không sử dụng cache
      // Sử dụng fetchQuery với staleTime: 0 và gcTime: 0 để đảm bảo luôn fetch fresh
      return queryClient.fetchQuery<DataTableResult<T>>({
        queryKey,
        queryFn: () => fetcher(params),
        staleTime: 0, // Không cache - luôn fetch fresh data
        gcTime: 0, // Không giữ cache
      })
    },
    [queryClient, fetcher, buildParams, buildQueryKey],
  )
}


