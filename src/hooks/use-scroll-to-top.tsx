"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Hook để tự động scroll về đầu trang khi pathname thay đổi
 * Sử dụng trong layout hoặc root component để đảm bảo mỗi khi chuyển page,
 * màn hình sẽ tự động scroll về đầu trang
 */
export function useScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Scroll to top khi pathname thay đổi
    // Sử dụng requestAnimationFrame + setTimeout để đảm bảo DOM đã render xong
    // và tất cả effects đã chạy xong
    const scrollToTop = () => {
      // Double RAF để đảm bảo DOM đã render hoàn toàn
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Scroll window về đầu trang
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant", // Dùng instant thay vì smooth để nhanh hơn
          })

          // Scroll main content area nếu có (thường là main element)
          const mainContent = document.querySelector("main")
          if (mainContent instanceof HTMLElement) {
            mainContent.scrollTo({
              top: 0,
              left: 0,
              behavior: "instant",
            })
          }

          // Nếu có scroll container (như ScrollArea), cũng scroll về đầu
          const scrollContainers = document.querySelectorAll(
            '[data-slot="scroll-area-viewport"]'
          )
          scrollContainers.forEach((container) => {
            if (container instanceof HTMLElement) {
              container.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant",
              })
            }
          })
        })
      })
    }

    scrollToTop()
  }, [pathname])
}

/**
 * Hook để detect scroll position và show/hide scroll-to-top button
 * @param threshold - Khoảng cách scroll (px) để hiển thị button, mặc định 300
 */
export function useScrollPosition(threshold = 300) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Kiểm tra scroll position của window
      const windowScroll = window.scrollY || window.pageYOffset
      
      // Kiểm tra scroll position của main content nếu có
      const mainContent = document.querySelector("main")
      const mainScroll = mainContent instanceof HTMLElement 
        ? mainContent.scrollTop 
        : 0

      // Hiển thị button nếu scroll vượt quá threshold
      setIsVisible(windowScroll > threshold || mainScroll > threshold)
    }

    // Lắng nghe scroll events trên window và main content
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    const mainContent = document.querySelector("main")
    if (mainContent instanceof HTMLElement) {
      mainContent.addEventListener("scroll", handleScroll, { passive: true })
    }

    // Kiểm tra ngay khi mount
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
 * Function để scroll về đầu trang
 */
export function scrollToTop() {
  // Scroll window về đầu trang
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  })

  // Scroll main content area nếu có
  const mainContent = document.querySelector("main")
  if (mainContent instanceof HTMLElement) {
    mainContent.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    })
  }

  // Scroll các scroll containers nếu có
  const scrollContainers = document.querySelectorAll(
    '[data-slot="scroll-area-viewport"]'
  )
  scrollContainers.forEach((container) => {
    if (container instanceof HTMLElement) {
      container.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      })
    }
  })
}
