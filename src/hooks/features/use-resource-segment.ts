"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { applyResourceSegmentToPath } from "@/permissions"
import { logger } from "@/utils"
import { ResourceSegmentContext } from "@/components/providers/resource-segment-provider"

/**
 * Hook để lấy resource segment hiện tại từ context
 */
export const useResourceSegment = (): string => React.useContext(ResourceSegmentContext)

/**
 * Hook để tự động áp dụng resource segment vào một đường dẫn
 */
export const useResourcePath = (path: string): string => {
  const segment = useResourceSegment()
  return applyResourceSegmentToPath(path, segment)
}

type RouterUrl = string

/**
 * Hook wrapper cho Next.js router để tự động xử lý resource segment khi điều hướng
 * Hỗ trợ logging và tracking performance điều hướng
 */
export const useResourceRouter = () => {
  const router = useRouter()
  const segment = useResourceSegment()

  return React.useMemo(() => {
    const pushFn = (url: RouterUrl, options?: Parameters<typeof router.push>[1]) => {
      const resolvedUrl = applyResourceSegmentToPath(url, segment)
      const startTime = performance.now()
      
      const isDetailPage = /\/\[id\]$/.test(url) || (/\/([^\/]+)$/.test(url) && !url.includes("/new") && !url.includes("/edit"))
      const isEditPage = url.includes("/edit")
      const isNewPage = url.includes("/new")
      const isListPage = !isDetailPage && !isEditPage && !isNewPage
      
      let navType = "unknown"
      if (isNewPage) navType = "new-page"
      else if (isEditPage) navType = "edit-page"
      else if (isDetailPage) navType = "detail-page"
      else if (isListPage) navType = "list-page"
      
      logger.info("➡️ Router.push", {
        source: "useResourceRouter",
        navType,
        originalUrl: url,
        resolvedUrl,
        resourceSegment: segment,
        currentPath: typeof window !== "undefined" ? window.location.pathname : undefined,
      })
      
      const result = router.push(resolvedUrl, options)
      
      setTimeout(() => {
        const duration = performance.now() - startTime
        logger.success("✅ Navigation completed", {
          navType,
          duration: `${duration.toFixed(2)}ms`,
          targetUrl: resolvedUrl,
        })
      }, 100)
      
      return result
    }

    const replaceFn = (url: RouterUrl, options?: Parameters<typeof router.replace>[1]) => {
      const resolvedUrl = applyResourceSegmentToPath(url, segment)
      const startTime = performance.now()
      
      logger.info("🔄 Router.replace", {
        source: "useResourceRouter",
        originalUrl: url,
        resolvedUrl,
        resourceSegment: segment,
        currentPath: typeof window !== "undefined" ? window.location.pathname : undefined,
      })
      
      const result = router.replace(resolvedUrl, options)
      
      setTimeout(() => {
        const duration = performance.now() - startTime
        logger.success("✅ Replace completed", {
          duration: `${duration.toFixed(2)}ms`,
          targetUrl: resolvedUrl,
        })
      }, 100)
      
      return result
    }

    return {
      ...router,
      push: pushFn,
      replace: replaceFn,
    }
  }, [router, segment])
}
