import { logger } from "@/lib/config"
import type { ResourceRefreshHandler } from "../types"

interface RunResourceRefreshOptions {
  refresh?: ResourceRefreshHandler
  resource?: string
  skipIfSocketRefreshed?: boolean
  debounceMs?: number
}

// Track last refresh time để debounce
const lastRefreshTime = new Map<string, number>()

export async function runResourceRefresh({
  refresh,
  resource = "unknown",
  skipIfSocketRefreshed: _skipIfSocketRefreshed = true,
  debounceMs = 500,
}: RunResourceRefreshOptions): Promise<void> {
  if (!refresh) return

  const now = Date.now()
  const lastRefresh = lastRefreshTime.get(resource) || 0
  const timeSinceLastRefresh = now - lastRefresh

  // Debounce: skip nếu refresh gần đây
  if (timeSinceLastRefresh < debounceMs) {
    logger.debug(`[${resource}] Skipping refresh (debounced, ${timeSinceLastRefresh}ms ago)`)
    return
  }

  lastRefreshTime.set(resource, now)

  try {
    await refresh()
  } catch (error) {
    logger.error(
      `[${resource}] Failed to refresh resource table`,
      error as Error,
    )
  }
}

