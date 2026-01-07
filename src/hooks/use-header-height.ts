"use client"

import { useEffect, useState } from "react"
import { useElementSize } from "./use-element-size"

const PUBLIC_HEADER_SELECTOR = 'header[data-public-header="true"]'

/**
 * Hook để đo chiều cao của public header động
 * Sử dụng ResizeObserver để tự động cập nhật khi header thay đổi kích thước
 */
export function useHeaderHeight() {
  const headerSize = useElementSize<HTMLElement>()
  const [headerHeight, setHeaderHeight] = useState(56) // Default: h-14 = 56px

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const header = document.querySelector<HTMLElement>(PUBLIC_HEADER_SELECTOR)
    if (!header) {
      // Fallback: đo header bằng cách tìm element header đầu tiên
      const fallbackHeader = document.querySelector<HTMLElement>("header")
      if (fallbackHeader) {
        headerSize.ref(fallbackHeader)
      }
      return
    }

    headerSize.ref(header)
    return () => {
      headerSize.ref(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerSize.ref])

  useEffect(() => {
    // Cập nhật headerHeight khi headerSize.height thay đổi
    if (headerSize.height > 0) {
      setHeaderHeight(headerSize.height)
    }
  }, [headerSize.height])

  return {
    headerHeight,
    headerRef: headerSize.ref,
  }
}

