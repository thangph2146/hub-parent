"use client"

import { useCallback } from "react"
import type { QueryClient, QueryKey } from "@tanstack/react-query"
import { useResourceRouter, useResourceSegment } from "@/hooks"
import { applyResourceSegmentToPath } from "@/permissions"
import { logger } from "@/utils"

export interface UseResourceNavigationOptions {
  queryClient?: QueryClient
  invalidateQueryKey?: QueryKey
}

export interface UseResourceNavigationResult {
  navigateBack: (backUrl: string, onBack?: () => Promise<void> | void) => Promise<void>
  navigate: (path: string) => Promise<void>
  router: ReturnType<typeof useResourceRouter>
}

// State để theo dõi navigation hiện tại
interface NavigationState {
  isNavigating: boolean
  targetPath: string | null
  startTime: number
}

let currentNavigation: NavigationState = {
  isNavigating: false,
  targetPath: null,
  startTime: 0,
}

// Thời gian tối đa để khóa một navigation (tránh trường hợp bị kẹt)
const NAVIGATION_LOCK_TIMEOUT = 5000 
// Thời gian tối thiểu giữa các lần click cùng một URL
const DOUBLE_CLICK_PREVENTION_MS = 800

export const useResourceNavigation = ({
  queryClient,
  invalidateQueryKey,
}: UseResourceNavigationOptions = {}): UseResourceNavigationResult => {
  const router = useResourceRouter()
  const resourceSegment = useResourceSegment()

  const navigateBack = useCallback(
    async (backUrl: string, onBack?: () => Promise<void> | void) => {
      const now = Date.now()
      const resolvedBackUrl = applyResourceSegmentToPath(backUrl, resourceSegment)

      // Kiểm tra xem có đang navigate đến cùng một URL không
      if (
        currentNavigation.isNavigating && 
        currentNavigation.targetPath === resolvedBackUrl &&
        now - currentNavigation.startTime < DOUBLE_CLICK_PREVENTION_MS
      ) {
        logger.debug("⏸️ Navigation đến cùng URL đang được xử lý, bỏ qua duplicate call", {
          backUrl,
          resolvedBackUrl,
          timeSinceStart: now - currentNavigation.startTime,
        })
        return
      }

      // Nếu đang navigate đến URL khác, hoặc đã quá timeout, cho phép tiếp tục
      if (
        currentNavigation.isNavigating && 
        now - currentNavigation.startTime > NAVIGATION_LOCK_TIMEOUT
      ) {
        logger.warn("⚠️ Navigation cũ quá lâu, forcing new navigation", {
          oldTarget: currentNavigation.targetPath,
          newTarget: resolvedBackUrl,
        })
      }

      currentNavigation = {
        isNavigating: true,
        targetPath: resolvedBackUrl,
        startTime: now,
      }
      
      const perfStartTime = performance.now()
      
      try {
        logger.info("🔄 Bắt đầu navigateBack", {
          backUrl,
          resolvedBackUrl,
          resourceSegment,
        })

        // 2. Gọi custom onBack callback nếu có (để invalidate React Query cache)
        if (onBack) {
          await onBack()
        }

        // 3. Invalidate React Query cache nếu có queryClient và queryKey
        if (queryClient && invalidateQueryKey) {
          await queryClient.invalidateQueries({ 
            queryKey: invalidateQueryKey, 
            refetchType: "active"
          })
        }

        logger.info("➡️ Đang thực hiện router.replace", { resolvedBackUrl })

        // 4. Navigate
        router.replace(resolvedBackUrl)
        
        const duration = performance.now() - perfStartTime
        logger.success("✅ Navigation back initiated", {
          duration: `${duration.toFixed(2)}ms`,
          targetUrl: resolvedBackUrl,
        })
      } finally {
        // Reset flag sau một delay ngắn để tránh double click
        setTimeout(() => {
          if (currentNavigation.targetPath === resolvedBackUrl) {
            currentNavigation.isNavigating = false
            currentNavigation.targetPath = null
          }
        }, DOUBLE_CLICK_PREVENTION_MS)
      }
    },
    [router, resourceSegment, queryClient, invalidateQueryKey],
  )

  const navigate = useCallback(
    async (path: string) => {
      const now = Date.now()
      const resolvedPath = applyResourceSegmentToPath(path, resourceSegment)

      // Kiểm tra xem có đang navigate đến cùng một URL không
      if (
        currentNavigation.isNavigating && 
        currentNavigation.targetPath === resolvedPath &&
        now - currentNavigation.startTime < DOUBLE_CLICK_PREVENTION_MS
      ) {
        logger.debug("⏸️ Navigation đến cùng URL đang được xử lý, bỏ qua duplicate call", {
          path,
          resolvedPath,
          timeSinceStart: now - currentNavigation.startTime,
        })
        return
      }

      // Nếu đang navigate đến URL khác, hoặc đã quá timeout, cho phép tiếp tục
      if (
        currentNavigation.isNavigating && 
        now - currentNavigation.startTime > NAVIGATION_LOCK_TIMEOUT
      ) {
        logger.warn("⚠️ Navigation cũ quá lâu, forcing new navigation", {
          oldTarget: currentNavigation.targetPath,
          newTarget: resolvedPath,
        })
      }

      currentNavigation = {
        isNavigating: true,
        targetPath: resolvedPath,
        startTime: now,
      }
      
      const perfStartTime = performance.now()

      try {
        logger.info("🔄 Bắt đầu navigate", {
          path,
          resolvedPath,
          resourceSegment,
        })

        // Kiểm tra xem có đang ở chính URL đó không để tránh redundant navigation
        if (typeof window !== "undefined" && window.location.pathname === resolvedPath) {
          logger.debug("ℹ️ Đang ở chính URL mục tiêu, thực hiện router.refresh thay vì push", { resolvedPath })
          router.refresh()
        } else {
          logger.info("➡️ Đang thực hiện router.push", { resolvedPath })
          router.push(resolvedPath)
        }

        const duration = performance.now() - perfStartTime
        logger.success("✅ Navigation initiated", {
          duration: `${duration.toFixed(2)}ms`,
          targetUrl: resolvedPath,
        })
      } finally {
        // Reset flag sau một delay ngắn để tránh double click
        // Sử dụng một khoảng thời gian dài hơn một chút để đảm bảo RSC bắt đầu load
        setTimeout(() => {
          if (currentNavigation.targetPath === resolvedPath) {
            currentNavigation.isNavigating = false
            currentNavigation.targetPath = null
          }
        }, DOUBLE_CLICK_PREVENTION_MS)
      }
    },
    [router, resourceSegment]
  )

  return { navigateBack, navigate, router }
}

