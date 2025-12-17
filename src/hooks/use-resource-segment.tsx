"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DEFAULT_RESOURCE_SEGMENT, applyResourceSegmentToPath } from "@/lib/permissions"
import { logger } from "@/lib/config/logger"

const ResourceSegmentContext = React.createContext<string>(DEFAULT_RESOURCE_SEGMENT)

export interface ResourceSegmentProviderProps {
  value: string
  children: React.ReactNode
}

export const ResourceSegmentProvider = ({ value, children }: ResourceSegmentProviderProps) => (
  <ResourceSegmentContext.Provider value={value}>
    {children}
  </ResourceSegmentContext.Provider>
)

export const useResourceSegment = (): string => React.useContext(ResourceSegmentContext)

export const useResourcePath = (path: string): string => {
  const segment = useResourceSegment()
  return applyResourceSegmentToPath(path, segment)
}

type RouterUrl = string

export const useResourceRouter = () => {
  const router = useRouter()
  const segment = useResourceSegment()

  // Sử dụng useMemo với dependency chỉ là segment
  // Router object từ Next.js là stable, nhưng để tránh re-create object mới,
  // chúng ta chỉ phụ thuộc vào segment và sử dụng router từ closure
  return React.useMemo(() => {
    const pushFn = (url: RouterUrl, options?: Parameters<typeof router.push>[1]) => {
      const resolvedUrl = applyResourceSegmentToPath(url, segment)
      const startTime = performance.now()
      
      // Detect navigation type
      const isDetailPage = /\/\[id\]$/.test(url) || /\/([^\/]+)$/.test(url) && !url.includes("/new") && !url.includes("/edit")
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
      
      // Log completion after a short delay
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

    // Trả về object mới với các methods được override
    // Nhưng giữ nguyên reference cho các methods khác từ router
    return {
      ...router,
      push: pushFn,
      replace: replaceFn,
    }
  }, [segment, router])
}

