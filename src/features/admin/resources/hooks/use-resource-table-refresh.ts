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
      // Lưu refreshFn vào ref để có thể gọi từ bất kỳ đâu
      softRefreshRef.current = refreshFn
      refreshRef.current = async () => {
        // Gọi refreshFn ngay lập tức để update refreshKey
        // refreshFn sẽ update refreshKey, và DataTable sẽ detect change và gọi loader
        // Loader sẽ fetch fresh data từ server (staleTime: 0, gcTime: 0)
        // Lưu ý: Queries đã được invalidate và refetch trong mutation onSuccess
        // Ở đây chỉ cần trigger UI refresh để DataTable re-fetch fresh data
        if (refreshFn) {
          logger.debug("Calling refreshFn to update refreshKey")
          refreshFn()
        } else {
          logger.warn("RefreshFn is not available")
        }
      }

      if (pendingRealtimeRefreshRef.current) {
        pendingRealtimeRefreshRef.current = false
        refreshFn()
      }

      // Đăng ký refresh callback vào global registry
      // Cho phép trigger refresh từ bất kỳ đâu (ví dụ: sau khi form submit)
      const invalidateKey = getInvalidateQueryKey?.()
      if (invalidateKey) {
        // Unregister callback cũ nếu có
        if (unregisterRef.current) {
          unregisterRef.current()
        }

        // Đăng ký callback mới với cả exact key và prefix key để đảm bảo luôn tìm thấy
        unregisterRef.current = resourceRefreshRegistry.register(
          invalidateKey,
          refreshFn,
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
    [getInvalidateQueryKey, queryClient],
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
    // Mutation đã trigger refresh thông qua registry, socket bridge chỉ cần update cache
    // Chỉ trigger refresh từ cacheVersion nếu mutation chưa trigger (debounce 100ms)
    const now = Date.now()
    if (now - lastCacheVersionRefreshRef.current < 100) {
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

    let refreshTimeout: NodeJS.Timeout | null = null

    // Không cần initialize lastDataUpdatedAt nữa vì không trigger refresh từ dataUpdatedAt changes
    // Chỉ trigger refresh từ registry (mutation onSuccess) hoặc khi query invalidated (fallback)

    // Subscribe to query cache events to detect when queries are invalidated
    // Also poll query state periodically to catch invalidations that might not fire events
    let checkInterval: NodeJS.Timeout | null = null
    
    const checkAndRefresh = () => {
      if (!softRefreshRef.current) return
      
      // Get all queries matching our invalidate key
      const queries = queryClient.getQueryCache().findAll({ queryKey: invalidateKey })
      
      if (queries.length === 0) return
      
      // CHỈ trigger refresh khi queries được invalidate (từ mutation)
      // KHÔNG trigger khi dataUpdatedAt thay đổi để tránh infinite loop
      // Refresh chính được trigger từ registry (được gọi từ mutation onSuccess)
      // Listener/polling chỉ là fallback nếu registry không hoạt động
      let shouldRefresh = false
      
      for (const query of queries) {
        // Chỉ check invalidation, không check dataUpdatedAt để tránh infinite loop
        if (query.state.isInvalidated) {
          shouldRefresh = true
          break
        }
      }
      
      if (shouldRefresh) {
        const now = Date.now()
        // Debounce 50ms để tránh trigger quá nhiều lần
        if (now - lastInvalidationRefreshRef.current < 50) {
          return
        }
        lastInvalidationRefreshRef.current = now

        // Trigger refresh immediately - no delay to ensure instant UI update
        if (softRefreshRef.current) {
          logger.debug("Query invalidated (detected via polling), triggering soft refresh immediately", { 
            queryKey: invalidateKey.slice(0, 3),
            invalidatedCount: queries.filter(q => q.state.isInvalidated).length,
          })
          try {
            softRefreshRef.current()
            logger.debug("Soft refresh executed successfully (via polling)")
          } catch (error) {
            logger.error("Failed to execute soft refresh (via polling)", error as Error)
          }
        }
      }
    }

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
        logger.debug("Query invalidated detected", {
          type: event.type,
          queryKey: queryKey.slice(0, 3),
          isInvalidated: event.query.state.isInvalidated,
        })
      }

      if (shouldRefresh) {
        // Trigger refresh với debounce để tránh trigger quá nhiều lần
        const now = Date.now()
        // Debounce 50ms để tránh trigger quá nhiều lần
        if (now - lastInvalidationRefreshRef.current < 50) {
          return
        }
        lastInvalidationRefreshRef.current = now
        
        if (softRefreshRef.current) {
          logger.debug("Query invalidated (detected via event), triggering soft refresh immediately", { 
            type: event.type,
            queryKey: queryKey.slice(0, 3),
            isInvalidated: event.query.state.isInvalidated,
          })
          try {
            softRefreshRef.current()
            logger.debug("Soft refresh executed successfully (via event)")
          } catch (error) {
            logger.error("Failed to execute soft refresh (via event)", error as Error)
          }
        }
      }
    })

    // Poll query state every 200ms to catch invalidations that might not fire events
    // This is a fallback mechanism - primary refresh is triggered from registry (mutation onSuccess)
    // 200ms is fast enough to catch invalidations but not so fast as to cause performance issues
    checkInterval = setInterval(checkAndRefresh, 200)

    return () => {
      unsubscribe()
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [queryClient, getInvalidateQueryKey])

  return { onRefreshReady, refresh, softRefresh }
}
