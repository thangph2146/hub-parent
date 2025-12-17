"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Helper to scroll element to top
 */
const scrollElementToTop = (element: HTMLElement, behavior: ScrollBehavior = "instant") => {
  element.scrollTo({ top: 0, left: 0, behavior })
}

/**
 * Scroll all scrollable containers to top
 */
const scrollAllToTop = (behavior: ScrollBehavior = "instant") => {
  // Scroll window
  window.scrollTo({ top: 0, left: 0, behavior })

  // Scroll main content area
  const mainContent = document.querySelector("main")
  if (mainContent instanceof HTMLElement) {
    scrollElementToTop(mainContent, behavior)
  }

  // Scroll scroll containers (ScrollArea)
  document.querySelectorAll('[data-slot="scroll-area-viewport"]').forEach((container) => {
    if (container instanceof HTMLElement) {
      scrollElementToTop(container, behavior)
    }
  })
}

/**
 * Hook để tự động scroll về đầu trang khi pathname thay đổi
 * Sử dụng trong layout hoặc root component để đảm bảo mỗi khi chuyển page,
 * màn hình sẽ tự động scroll về đầu trang
 */
export const useScrollToTop = () => {
  const pathname = usePathname()

  useEffect(() => {
    // Double RAF để đảm bảo DOM đã render hoàn toàn
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollAllToTop("instant")
      })
    })
  }, [pathname])
}

/**
 * Hook để detect scroll position và show/hide scroll-to-top button
 * @param threshold - Khoảng cách scroll (px) để hiển thị button, mặc định 300
 */
export const useScrollPosition = (threshold = 300) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const windowScroll = window.scrollY || window.pageYOffset
      const mainContent = document.querySelector("main")
      const mainScroll = mainContent instanceof HTMLElement ? mainContent.scrollTop : 0
      setIsVisible(windowScroll > threshold || mainScroll > threshold)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    const mainContent = document.querySelector("main")
    if (mainContent instanceof HTMLElement) {
      mainContent.addEventListener("scroll", handleScroll, { passive: true })
    }

    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (mainContent instanceof HTMLElement) {
        mainContent.removeEventListener("scroll", handleScroll)
      }
    }
  }, [threshold])

  return isVisible
}

/**
 * Function để scroll về đầu trang với smooth behavior
 */
export const scrollToTop = () => scrollAllToTop("smooth")
