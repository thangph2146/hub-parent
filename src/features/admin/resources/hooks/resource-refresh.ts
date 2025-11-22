import { logger } from "@/lib/config"
import type { ResourceRefreshHandler } from "../types"

interface RunResourceRefreshOptions {
  refresh?: ResourceRefreshHandler
  resource?: string
  /**
   * Skip refresh nếu socket đã trigger refresh gần đây (trong vòng debounceMs)
   * Mặc định: true - để tránh duplicate refresh khi socket events đã update cache
   */
  skipIfSocketRefreshed?: boolean
  /**
   * Debounce time trong ms (mặc định: 500ms)
   * Chỉ refresh một lần trong khoảng thời gian này
   */
  debounceMs?: number
}

// Track last refresh time để debounce
const lastRefreshTime = new Map<string, number>()

/**
 * Helper để gọi refresh từ ResourceTableRefresh một cách an toàn
 * - Tránh crash UI khi refresh throw error
 * - Ghi log để dễ debug
 * - Debounce để tránh duplicate refresh
 * - Skip nếu socket đã trigger refresh gần đây
 */
export async function runResourceRefresh({
  refresh,
  resource = "unknown",
  skipIfSocketRefreshed = true,
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

