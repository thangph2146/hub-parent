import { useCallback, useEffect, useRef } from "react"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import { logger } from "@/lib/config/logger"
import { resourceRefreshRegistry } from "./resource-refresh-registry"

interface UseResourceTableRefreshOptions {
  queryClient: QueryClient
  getInvalidateQueryKey?: () => QueryKey
  cacheVersion?: number
}

interface UseResourceTableRefreshResult {
  onRefreshReady: (refresh: () => void) => void
  refresh: () => Promise<void>
  softRefresh: () => void
}

export const useResourceTableRefresh = ({
  queryClient,
  getInvalidateQueryKey,
  cacheVersion,
}: UseResourceTableRefreshOptions): UseResourceTableRefreshResult => {
  const refreshRef = useRef<(() => void) | null>(null)
  const softRefreshRef = useRef<(() => void) | null>(null)
  const pendingRealtimeRefreshRef = useRef(false)
  const lastCacheVersionRef = useRef<number | undefined>(undefined)
  const lastInvalidationRefreshRef = useRef(0)
  const lastCacheVersionRefreshRef = useRef(0)
  const unregisterRef = useRef<(() => void) | null>(null)

  const refresh = useCallback(async () => {
    if (!refreshRef.current) {
      logger.warn("Refresh function not ready yet")
      return
    }
    logger.debug("Triggering full refresh")
    await refreshRef.current()
  }, [])

  const softRefresh = useCallback(() => {
    if (!softRefreshRef.current) {
      logger.debug("Soft refresh function not ready, marking as pending")
      pendingRealtimeRefreshRef.current = true
      return
    }
    // Loại bỏ isRefreshingRef check để đảm bảo refresh luôn được trigger
    // DataTable sẽ tự handle duplicate refreshes thông qua refreshKey comparison
    logger.debug("Triggering soft refresh", {
      hasCallback: !!softRefreshRef.current,
    })
    try {
      softRefreshRef.current()
      logger.debug("Soft refresh executed successfully")
    } catch (error) {
      logger.error("Failed to execute soft refresh", error as Error)
    }
  }, [])

  const onRefreshReady = useCallback(
    (refreshFn: () => void) => {
      if (!refreshFn) {
        logger.warn("onRefreshReady called with null/undefined refreshFn")
        return
      }

      logger.debug("onRefreshReady called", {
        hasRefreshFn: !!refreshFn,
        hasGetInvalidateQueryKey: !!getInvalidateQueryKey,
      })

      // Lưu refreshFn vào ref để có thể gọi từ bất kỳ đâu
      // Wrap refreshFn để update lastInvalidationRefreshRef khi được gọi từ registry
      // Điều này đảm bảo polling biết không cần check lại trong một khoảng thời gian
      const wrappedRefreshFn = () => {
        // Update lastInvalidationRefreshRef để polling biết không cần check lại
        lastInvalidationRefreshRef.current = Date.now()
        refreshFn()
      }
      
      softRefreshRef.current = wrappedRefreshFn
      refreshRef.current = async () => {
        // Gọi refreshFn ngay lập tức để update refreshKey
        // refreshFn sẽ update refreshKey, và DataTable sẽ detect change và gọi loader
        // Loader sẽ fetch data với cache (staleTime: 30s) để giảm số lần refetch không cần thiết
        // Lưu ý: Queries đã được invalidate và refetch trong mutation onSuccess
        // Ở đây chỉ cần trigger UI refresh để DataTable re-fetch fresh data khi cần
        if (wrappedRefreshFn) {
          logger.debug("Calling refreshFn to update refreshKey")
          wrappedRefreshFn()
        } else {
          logger.warn("RefreshFn is not available")
        }
      }

      // Xử lý pending realtime refresh nếu có
      if (pendingRealtimeRefreshRef.current) {
        pendingRealtimeRefreshRef.current = false
        logger.debug("Executing pending realtime refresh")
        wrappedRefreshFn()
      }

      // Đăng ký refresh callback vào global registry
      // Cho phép trigger refresh từ bất kỳ đâu (ví dụ: sau khi form submit)
      // Sử dụng wrappedRefreshFn để đảm bảo lastInvalidationRefreshRef được update
      const invalidateKey = getInvalidateQueryKey?.()
      if (invalidateKey) {
        // Unregister callback cũ nếu có
        if (unregisterRef.current) {
          logger.debug("Unregistering old refresh callback")
          unregisterRef.current()
        }

        // Đăng ký callback mới với cả exact key và prefix key để đảm bảo luôn tìm thấy
        // Sử dụng wrappedRefreshFn để update lastInvalidationRefreshRef khi registry trigger
        unregisterRef.current = resourceRefreshRegistry.register(
          invalidateKey,
          wrappedRefreshFn,
          "resource-table",
        )
        
        logger.debug("Registered refresh callback in global registry", {
          queryKey: invalidateKey.slice(0, 3),
          queryKeyFull: JSON.stringify(invalidateKey),
          hasCallback: !!refreshFn,
        })
      } else {
        logger.warn("Cannot register refresh callback - invalidateKey is not available", {
          hasGetInvalidateQueryKey: !!getInvalidateQueryKey,
        })
      }
    },
    [getInvalidateQueryKey],
  )

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (unregisterRef.current) {
        unregisterRef.current()
        unregisterRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!cacheVersion || cacheVersion === lastCacheVersionRef.current) return

    lastCacheVersionRef.current = cacheVersion
    
    // Debounce cache version refresh để tránh double refresh với mutation refresh
    // Mutation đã trigger refresh thông qua query invalidation events listener và registry
    // Chỉ trigger refresh từ cacheVersion nếu không có query invalidation gần đây (debounce 5000ms)
    const now = Date.now()
    const timeSinceLastInvalidation = now - lastInvalidationRefreshRef.current
    
    // Nếu có query invalidation gần đây (< 6000ms), skip cache version refresh
    // Vì query invalidation events listener và registry đã trigger refresh rồi
    // Tăng thời gian lên 6000ms để đảm bảo cache version từ socket không trigger refresh không cần thiết
    // Thêm buffer 1000ms để tránh edge case khi cache version đến đúng lúc 5000ms
    if (timeSinceLastInvalidation < 6000) {
      logger.debug("Cache version refresh skipped (query invalidation already triggered refresh)", { 
        cacheVersion,
        timeSinceLastInvalidation,
        debounceMs: 6000
      })
      return
    }
    
    // Debounce cache version refresh để tránh trigger quá nhiều lần
    // Tăng debounce lên 6000ms để tránh refresh quá thường xuyên từ socket
    if (now - lastCacheVersionRefreshRef.current < 6000) {
      logger.debug("Cache version refresh debounced", { 
        cacheVersion,
        timeSinceLastRefresh: now - lastCacheVersionRefreshRef.current 
      })
      return
    }
    lastCacheVersionRefreshRef.current = now
    
    logger.debug("Cache version changed, triggering soft refresh", { cacheVersion })

    if (softRefreshRef.current) {
      softRefreshRef.current()
      pendingRealtimeRefreshRef.current = false
    } else {
      pendingRealtimeRefreshRef.current = true
    }
  }, [cacheVersion])

  // Listen for query invalidation events to auto-refresh table
  // This ensures table refreshes automatically when queries are invalidated (e.g., after form submit)
  useEffect(() => {
    if (!getInvalidateQueryKey) return

    const invalidateKey = getInvalidateQueryKey()
    if (!invalidateKey || !Array.isArray(invalidateKey)) return

    const refreshTimeout: NodeJS.Timeout | null = null

   
    // Subscribe to query cache events
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event?.query) return
      
      const queryKey = event.query.queryKey
      if (!queryKey || !Array.isArray(queryKey)) return

      // Check if the query matches our table's query key prefix
      const matches = invalidateKey.every((key, index) => {
        if (index >= queryKey.length) return false
        return queryKey[index] === key
      })
      
      if (!matches) return

      // CHỈ trigger refresh khi query được invalidated (từ mutation)
      // KHÔNG trigger khi dataUpdatedAt thay đổi để tránh infinite loop
      // Refresh chính được trigger từ registry (được gọi từ mutation onSuccess)
      // Listener chỉ là fallback nếu registry không hoạt động
      const shouldRefresh = event.type === "updated" && event.query.state.isInvalidated
      
      // Log để debug (chỉ log khi invalidated, không log dataUpdatedAt changes)
      if (event.type === "updated" && event.query.state.isInvalidated) {
        // QUAN TRỌNG: Update lastInvalidationRefreshRef ngay khi query được invalidate
        // Để cache version refresh có thể skip nếu có query invalidation gần đây
        const now = Date.now()
        lastInvalidationRefreshRef.current = now
        
        logger.debug("Query invalidated detected", {
          type: event.type,
          queryKey: queryKey.slice(0, 3),
          isInvalidated: event.query.state.isInvalidated,
        })
      }

      if (shouldRefresh) {
        // Trigger refresh với debounce để tránh trigger quá nhiều lần
        // Registry đã trigger refresh ngay sau khi mutation thành công
        // Query cache subscription chỉ là fallback nếu registry không hoạt động
        // Debounce 2000ms (2 giây) để đảm bảo registry đã trigger trước
        const now = Date.now()
        const timeSinceLastRefresh = now - lastInvalidationRefreshRef.current
        
        if (timeSinceLastRefresh < 2000) {
          logger.debug("Skipping query cache refresh (debounced, registry may have already triggered)", {
            timeSinceLastRefresh,
            debounceMs: 2000,
          })
          return
        }
        
        // lastInvalidationRefreshRef đã được update ở trên khi detect invalidate
        
        if (softRefreshRef.current) {
          logger.debug("Query invalidated (detected via cache subscription), triggering soft refresh", { 
            type: event.type,
            queryKey: queryKey.slice(0, 3),
            isInvalidated: event.query.state.isInvalidated,
            timeSinceLastRefresh,
          })
          try {
            softRefreshRef.current()
            logger.debug("Soft refresh executed successfully (via cache subscription)")
          } catch (error) {
            logger.error("Failed to execute soft refresh (via cache subscription)", error as Error)
          }
        }
      }
    })

    // TẮT POLLING HOÀN TOÀN
    // Registry đã trigger refresh ngay sau khi mutation thành công và hoạt động tốt
    // Polling chỉ tạo ra refresh không cần thiết và làm tăng số lần fetch
    // Nếu registry không hoạt động, có thể bật lại polling nhưng với interval cao hơn (10 giây)
    // checkInterval = setInterval(checkAndRefresh, 2000)

    return () => {
      unsubscribe()
      // Không cần clearInterval vì đã tắt polling
      // if (checkInterval) {
      //   clearInterval(checkInterval)
      // }
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [queryClient, getInvalidateQueryKey])

  return { onRefreshReady, refresh, softRefresh }
}
