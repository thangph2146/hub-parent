import { logger } from "@/lib/config/logger"
import type { ResourceRefreshHandler } from "../types"

interface RunResourceRefreshOptions {
  refresh?: ResourceRefreshHandler
  resource?: string
  skipIfSocketRefreshed?: boolean
  debounceMs?: number
}

const lastRefreshTime = new Map<string, number>()

export const runResourceRefresh = async ({
  refresh,
  resource = "unknown",
  skipIfSocketRefreshed: _skipIfSocketRefreshed = true,
  debounceMs = 0, // Loại bỏ debounce để refresh ngay lập tức
}: RunResourceRefreshOptions): Promise<void> => {
  if (!refresh) return

  const now = Date.now()
  const lastRefresh = lastRefreshTime.get(resource) || 0
  const timeSinceLastRefresh = now - lastRefresh

  // Chỉ debounce nếu debounceMs > 0 và thời gian quá ngắn
  if (debounceMs > 0 && timeSinceLastRefresh < debounceMs) {
    logger.debug(`[${resource}] Skipping refresh (debounced, ${timeSinceLastRefresh}ms ago)`)
    return
  }

  lastRefreshTime.set(resource, now)

  try {
    // Gọi refresh callback ngay lập tức để trigger re-render của table
    // Lưu ý: Registry đã trigger refresh trong mutation onSuccess
    // Đây chỉ là fallback nếu registry không tìm thấy callback
    // Refresh callback sẽ update refreshKey để trigger DataTable re-fetch
    const result = refresh()
    // Chỉ await nếu callback trả về Promise
    if (result instanceof Promise) {
      await result
    }
  } catch (error) {
    logger.error(
      `[${resource}] Failed to refresh resource table`,
      error as Error,
    )
  }
};

