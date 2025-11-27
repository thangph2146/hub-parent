import { useCallback, useEffect, useRef } from "react"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import { logger } from "@/lib/config/logger"

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

export function useResourceTableRefresh({
  queryClient,
  getInvalidateQueryKey,
  cacheVersion,
}: UseResourceTableRefreshOptions): UseResourceTableRefreshResult {
  const refreshRef = useRef<(() => void) | null>(null)
  const softRefreshRef = useRef<(() => void) | null>(null)
  const pendingRealtimeRefreshRef = useRef(false)
  const lastCacheVersionRef = useRef<number | undefined>(undefined)

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
    logger.debug("Triggering soft refresh")
    softRefreshRef.current()
  }, [])

  const onRefreshReady = useCallback(
    (refreshFn: () => void) => {
      softRefreshRef.current = refreshFn
      refreshRef.current = async () => {
        const invalidateKey = getInvalidateQueryKey?.()
        if (invalidateKey) {
          await queryClient.invalidateQueries({ queryKey: invalidateKey, refetchType: "active" })
          await queryClient.refetchQueries({ queryKey: invalidateKey, type: "active" })
        }
        refreshFn()
      }

      if (pendingRealtimeRefreshRef.current) {
        pendingRealtimeRefreshRef.current = false
        refreshFn()
      }
    },
    [getInvalidateQueryKey, queryClient],
  )

  useEffect(() => {
    if (!cacheVersion || cacheVersion === lastCacheVersionRef.current) return

    lastCacheVersionRef.current = cacheVersion
    logger.debug("Cache version changed, triggering soft refresh", { cacheVersion })

    if (softRefreshRef.current) {
      softRefreshRef.current()
      pendingRealtimeRefreshRef.current = false
    } else {
      pendingRealtimeRefreshRef.current = true
    }
  }, [cacheVersion])

  return { onRefreshReady, refresh, softRefresh }
}
