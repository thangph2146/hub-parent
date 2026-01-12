"use client"

/**
 * Hook để tự động tạo Session record sau khi đăng nhập thành công
 * Sử dụng trong SessionProvider hoặc layout để tự động tạo session khi user đăng nhập
 * 
 * Logic:
 * - Chỉ tạo session một lần cho mỗi user session (track bằng localStorage)
 * - Tự động tạo cho cả credentials và OAuth (Google) login
 * - Không block app nếu có lỗi
 * - Sử dụng localStorage để persist việc đã tạo session, tránh gọi lại khi reload
 */

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { logger } from "@/lib/config"
import { extractAxiosErrorMessage } from "@/lib/utils"

const SESSION_CREATED_KEY_PREFIX = "session_created_"
const SESSION_CREATED_EXPIRY_MS = 5 * 60 * 1000 // 5 phút - đủ để tránh duplicate calls nhưng vẫn cho phép tạo lại nếu cần

const getSessionCreatedKey = (userId: string): string => `${SESSION_CREATED_KEY_PREFIX}${userId}`

const hasSessionBeenCreated = (userId: string): boolean => {
  if (typeof window === "undefined") return false
  
  try {
    const key = getSessionCreatedKey(userId)
    const stored = localStorage.getItem(key)
    
    if (!stored) return false
    
    const timestamp = parseInt(stored, 10)
    if (isNaN(timestamp)) return false
    
    // Kiểm tra xem đã quá thời gian expiry chưa
    const now = Date.now()
    const isExpired = now - timestamp > SESSION_CREATED_EXPIRY_MS
    
    if (isExpired) {
      // Cleanup expired entry
      localStorage.removeItem(key)
      return false
    }
    
    return true
  } catch (error) {
    logger.warn("Error checking session created status in localStorage", { error })
    return false
  }
}

const markSessionAsCreated = (userId: string): void => {
  if (typeof window === "undefined") return
  
  try {
    const key = getSessionCreatedKey(userId)
    localStorage.setItem(key, Date.now().toString())
  } catch (error) {
    logger.warn("Error marking session as created in localStorage", { error })
  }
}

/**
 * Cleanup localStorage khi user logout
 * Export để có thể gọi từ signOut handler
 */
export const cleanupSessionCreatedFlag = (userId?: string): void => {
  if (typeof window === "undefined") return
  
  try {
    if (userId) {
      // Cleanup specific user
      const key = getSessionCreatedKey(userId)
      localStorage.removeItem(key)
    } else {
      // Cleanup all session created flags
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(SESSION_CREATED_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))
    }
  } catch (error) {
    logger.warn("Error cleaning up session created flags", { error })
  }
}

export const useCreateLoginSession = () => {
  const { data: session, status } = useSession()
  const isCreatingRef = useRef(false)
  const processedUserIdRef = useRef<string | null>(null) // Track userId đã được xử lý

  useEffect(() => {
    // Chỉ chạy khi đã authenticated và có userId
    if (status !== "authenticated" || !session?.user?.id) {
      // Reset processedUserIdRef khi logout hoặc chưa authenticated
      if (status !== "authenticated") {
        processedUserIdRef.current = null
      }
      return
    }

    const userId = session.user.id

    // Nếu đã xử lý userId này rồi, không làm gì nữa
    // Điều này đảm bảo chỉ gọi một lần cho mỗi userId, ngay cả khi component re-mount
    if (processedUserIdRef.current === userId) {
      return
    }

    // Kiểm tra xem đã tạo session cho user này chưa (từ localStorage)
    if (hasSessionBeenCreated(userId) || isCreatingRef.current) {
      // Đánh dấu đã xử lý userId này
      processedUserIdRef.current = userId
      return
    }

    // Tạo session record
    const createSession = async () => {
      // Đánh dấu đang tạo để tránh duplicate calls
      isCreatingRef.current = true
      // Đánh dấu đã xử lý userId này ngay lập tức để tránh duplicate calls
      processedUserIdRef.current = userId

      try {
        logger.debug("Creating login session via hook", { userId })
        
        await apiClient.post(apiRoutes.auth.createSession, {})
        
        // Đánh dấu đã tạo session cho user này (persist trong localStorage)
        markSessionAsCreated(userId)
        
        logger.debug("Login session created successfully via hook", { userId })
      } catch (error) {
        const errorMessage = extractAxiosErrorMessage(error)
        const isUserNotFound = errorMessage?.toLowerCase().includes("does not exist") || 
                              errorMessage?.toLowerCase().includes("not found")
        
        // Nếu user không tồn tại, đánh dấu để không retry và downgrade log level
        if (isUserNotFound) {
          // Đánh dấu đã xử lý để không retry
          markSessionAsCreated(userId)
          // Log warning thay vì error vì đây không phải lỗi nghiêm trọng
          logger.warn("User not found when creating login session - skipping", {
            userId,
            error: errorMessage,
          })
        } else {
          // Log error cho các lỗi khác
          logger.error("Failed to create login session via hook", {
            userId,
            error: errorMessage,
          })
          // Reset processedUserIdRef để có thể retry nếu cần
          // Nhưng chỉ reset sau một delay để tránh retry ngay lập tức
          setTimeout(() => {
            if (processedUserIdRef.current === userId) {
              processedUserIdRef.current = null
            }
          }, 5000) // Retry sau 5 giây nếu có lỗi
        }
      } finally {
        isCreatingRef.current = false
      }
    }

    createSession()
  }, [session?.user?.id, status])
}

