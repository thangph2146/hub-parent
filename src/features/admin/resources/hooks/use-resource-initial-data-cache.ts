import { useEffect, useRef } from "react"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { DataTableResult } from "@/components/tables"
import { logger } from "@/lib/config"

interface UseResourceInitialDataCacheOptions<T extends object, P> {
  initialData?: DataTableResult<T>
  queryClient: QueryClient
  /**
   * Hàm build params để tạo query key tương ứng với initial data
   */
  buildParams: (initialData: DataTableResult<T>) => P
  /**
   * Hàm tạo query key cho list query (ví dụ queryKeys.adminTags.list)
   */
  buildQueryKey: (params: P) => QueryKey
  /**
   * Resource name để logging (ví dụ "students", "tags")
   */
  resourceName?: string
}

/**
 * Đồng bộ initial data (SSR) vào React Query cache để realtime updates hoạt động ổn định
 * 
 * @example
 * ```tsx
 * useResourceInitialDataCache({
 *   initialData,
 *   queryClient,
 *   buildParams: (data) => ({ page: data.page, limit: data.limit, status: "active" }),
 *   buildQueryKey: (params) => queryKeys.adminTags.list(params),
 *   resourceName: "tags",
 * })
 * ```
 */
export function useResourceInitialDataCache<T extends object, P>({
  initialData,
  queryClient,
  buildParams,
  buildQueryKey,
  resourceName = "resource",
}: UseResourceInitialDataCacheOptions<T, P>) {
  const hasCachedRef = useRef(false)
  const loggedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!initialData) return

    const params = buildParams(initialData)
    const queryKey = buildQueryKey(params)
    const cacheKey = JSON.stringify(queryKey)

    // Chỉ cache một lần cho mỗi query key để tránh duplicate logs (React Strict Mode)
    if (loggedKeysRef.current.has(cacheKey)) {
      return
    }

    // Kiểm tra xem cache đã có dữ liệu chưa (từ socket event hoặc từ updateResourceCacheAfterEdit)
    const existingCache = queryClient.getQueryData<DataTableResult<T>>(queryKey)
    
    if (existingCache && existingCache.rows.length > 0) {
      // QUAN TRỌNG: Ưu tiên cache hiện tại nếu nó có nhiều rows hơn initialData
      // Điều này đảm bảo rằng cache từ socket updates hoặc optimistic updates không bị ghi đè
      // bởi initialData từ SSR (có thể stale hoặc không đầy đủ)
      if (existingCache.rows.length > initialData.rows.length) {
        logger.debug(`[useResourceInitialDataCache:${resourceName}] Cache has more rows, keeping cache`, {
          queryKey,
          existingRowsCount: existingCache.rows.length,
          initialRowsCount: initialData.rows.length,
          existingTotal: existingCache.total,
          initialTotal: initialData.total,
        })
        loggedKeysRef.current.add(cacheKey)
        return
      }
      
      // So sánh timestamp để quyết định có ghi đè hay không
      // Nếu existingCache mới hơn initialData, skip để giữ data mới nhất
      // Tìm row có cùng ID trong cả hai để so sánh chính xác
      const existingFirstRow = existingCache.rows[0] as Record<string, unknown>
      const initialFirstRow = initialData.rows[0] as Record<string, unknown>
      
      // Tìm row có cùng ID để so sánh chính xác hơn
      const firstRowId = existingFirstRow?.id || initialFirstRow?.id
      const existingRow = firstRowId 
        ? existingCache.rows.find((r) => (r as Record<string, unknown>).id === firstRowId) as Record<string, unknown> | undefined
        : existingFirstRow
      const initialRow = firstRowId
        ? initialData.rows.find((r) => (r as Record<string, unknown>).id === firstRowId) as Record<string, unknown> | undefined
        : initialFirstRow
      
      const existingUpdatedAt = existingRow?.updatedAt as string | undefined
      const initialUpdatedAt = initialRow?.updatedAt as string | undefined
      
      // Nếu cả hai đều có updatedAt, so sánh timestamp
      if (existingUpdatedAt && initialUpdatedAt) {
        const existingTime = new Date(existingUpdatedAt).getTime()
        const initialTime = new Date(initialUpdatedAt).getTime()
        
        if (existingTime >= initialTime) {
          // Cache hiện tại mới hơn hoặc bằng initialData, không ghi đè
          logger.debug(`[useResourceInitialDataCache:${resourceName}] Cache is newer or equal, skipping`, {
            queryKey,
            existingRowsCount: existingCache.rows.length,
            initialRowsCount: initialData.rows.length,
            existingUpdatedAt,
            initialUpdatedAt,
            existingData: existingRow,
            initialData: initialRow,
          })
          loggedKeysRef.current.add(cacheKey)
          return
        }
      } else if (existingUpdatedAt && !initialUpdatedAt) {
        // Nếu existingCache có updatedAt nhưng initialData không có, cần so sánh dữ liệu
        // Nếu initialData có dữ liệu khác (mới hơn từ database), cần merge hoặc update
        // So sánh các field quan trọng để quyết định
        if (existingRow && initialRow) {
          const importantFields = ['name', 'title', 'slug', 'email'] // Các field quan trọng để so sánh
          const hasDataDifference = importantFields.some(field => {
            const existingValue = existingRow[field]
            const initialValue = initialRow[field]
            return existingValue !== undefined && initialValue !== undefined && existingValue !== initialValue
          })
          
          if (hasDataDifference) {
            // InitialData có dữ liệu khác, có thể mới hơn từ database
            // Merge: giữ updatedAt từ cache nhưng update data từ initialData
            const mergedRow = { ...initialRow, updatedAt: existingUpdatedAt }
            const mergedRows = existingCache.rows.map(r => {
              const rowId = (r as Record<string, unknown>).id
              return rowId === firstRowId ? mergedRow : r
            })
            const mergedCache = {
              ...existingCache,
              rows: mergedRows,
            }
            queryClient.setQueryData(queryKey, mergedCache)
            logger.debug(`[useResourceInitialDataCache:${resourceName}] Merged cache with initialData (cache has updatedAt, initialData has newer data)`, {
              queryKey,
              existingRowsCount: existingCache.rows.length,
              initialRowsCount: initialData.rows.length,
              existingUpdatedAt,
              existingData: existingRow,
              initialData: initialRow,
              mergedData: mergedRow,
            })
            loggedKeysRef.current.add(cacheKey)
            return
          }
        }
        
        // Nếu không có sự khác biệt về dữ liệu, giữ cache (cache đã được update bởi edit operation)
        logger.debug(`[useResourceInitialDataCache:${resourceName}] Cache has updatedAt but initialData doesn't, keeping cache`, {
          queryKey,
          existingRowsCount: existingCache.rows.length,
          initialRowsCount: initialData.rows.length,
          existingUpdatedAt,
          existingData: existingRow,
          initialData: initialRow,
        })
        loggedKeysRef.current.add(cacheKey)
        return
      } else if (!existingUpdatedAt && !initialUpdatedAt) {
        // Nếu cả hai đều không có updatedAt, so sánh dữ liệu để quyết định
        // Nếu existingCache có nhiều fields hơn hoặc có dữ liệu khác, ưu tiên cache
        const existingKeys = Object.keys(existingRow || {})
        const initialKeys = Object.keys(initialRow || {})
        
        if (existingKeys.length >= initialKeys.length) {
          // Cache có đầy đủ hoặc nhiều fields hơn, giữ cache
          logger.debug(`[useResourceInitialDataCache:${resourceName}] Cache has more or equal fields, keeping cache`, {
            queryKey,
            existingRowsCount: existingCache.rows.length,
            initialRowsCount: initialData.rows.length,
            existingTotal: existingCache.total,
            initialTotal: initialData.total,
            existingKeys: existingKeys.length,
            initialKeys: initialKeys.length,
            existingData: existingRow,
            initialData: initialRow,
          })
          loggedKeysRef.current.add(cacheKey)
          return
        }
      }
      
      // Nếu initialData mới hơn, log và ghi đè cache
      logger.debug(`[useResourceInitialDataCache:${resourceName}] Initial data is newer, updating cache`, {
        queryKey,
        existingRowsCount: existingCache.rows.length,
        initialRowsCount: initialData.rows.length,
        existingUpdatedAt,
        initialUpdatedAt,
      })
    }

    // Chỉ set cache nếu chưa có dữ liệu
    queryClient.setQueryData(queryKey, initialData)
    loggedKeysRef.current.add(cacheKey)

    logger.debug(`[useResourceInitialDataCache:${resourceName}] Set initial data to cache`, {
      queryKey,
      rowsCount: initialData.rows.length,
      total: initialData.total,
    })

    // Cleanup sau một khoảng thời gian để cho phép log lại khi navigate
    return () => {
      setTimeout(() => {
        loggedKeysRef.current.delete(cacheKey)
      }, 2000)
    }
  }, [initialData, queryClient, buildParams, buildQueryKey, resourceName])
}
