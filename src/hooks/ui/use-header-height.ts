"use client"

import { useEffect, useState, useCallback } from "react"
import { useElementSize } from "../shared/use-element-size"

const PUBLIC_HEADER_SELECTOR = 'header[data-public-header="true"]'

/**
 * Hook để đo chiều cao của public header động
 * Sử dụng ResizeObserver để tự động cập nhật khi header thay đổi kích thước
 */
export function useHeaderHeight() {
  const headerSize = useElementSize<HTMLElement>()
  const [headerHeight, setHeaderHeight] = useState(56) // Default: h-14 = 56px

  const findAndSetHeader = useCallback(() => {
    if (typeof document === "undefined") {
      return null
    }

    // Ưu tiên tìm header với data-public-header="true"
    let header = document.querySelector<HTMLElement>(PUBLIC_HEADER_SELECTOR)
    
    // Fallback: đo header bằng cách tìm element header đầu tiên
    if (!header) {
      header = document.querySelector<HTMLElement>("header")
    }

    if (header) {
      headerSize.ref(header)
      return header
    }

    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerSize.ref])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    // Tìm header ngay lập tức
    findAndSetHeader()

    // Retry tìm header nếu chưa tìm thấy (có thể do SSR hoặc component chưa mount)
    let retryCount = 0
    const maxRetries = 20 // Tăng số lần retry
    const retryInterval = 50 // Giảm interval để tìm nhanh hơn

    const retryTimer = setInterval(() => {
      const header = findAndSetHeader()
      if (header || retryCount >= maxRetries) {
        clearInterval(retryTimer)
      }
      retryCount++
    }, retryInterval)

    // Sử dụng MutationObserver để theo dõi khi header được thêm vào DOM
    const observer = new MutationObserver(() => {
      findAndSetHeader()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Thêm event listener để đo lại khi window resize
    const handleResize = () => {
      findAndSetHeader()
    }
    window.addEventListener("resize", handleResize)

    return () => {
      clearInterval(retryTimer)
      observer.disconnect()
      window.removeEventListener("resize", handleResize)
      headerSize.ref(null)
    }
  }, [findAndSetHeader, headerSize])

  useEffect(() => {
    // Cập nhật headerHeight khi headerSize.height thay đổi
    if (headerSize.height > 0) {
      setHeaderHeight(headerSize.height)
    } else {
      // Nếu chưa có height, thử đo lại bằng getBoundingClientRect
      const header = document.querySelector<HTMLElement>(PUBLIC_HEADER_SELECTOR) || 
                    document.querySelector<HTMLElement>("header")
      if (header) {
        const rect = header.getBoundingClientRect()
        if (rect.height > 0) {
          setHeaderHeight(rect.height)
        }
      }
    }
  }, [headerSize.height])

  return {
    headerHeight,
    headerRef: headerSize.ref,
  }
}
