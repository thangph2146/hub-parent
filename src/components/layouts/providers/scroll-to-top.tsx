"use client"

import { useScrollToTop, useScrollPosition, scrollToTop } from "@/hooks/use-scroll-to-top"
import { Button } from "@/components/ui/button"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { iconSizes } from "@/lib/typography"

/**
 * Component để tự động scroll về đầu trang khi pathname thay đổi
 * và hiển thị button scroll-to-top floating ở góc dưới bên phải
 */
export function ScrollToTop() {
  // Tự động scroll khi pathname thay đổi
  useScrollToTop()
  
  // Detect scroll position để show/hide button
  const isVisible = useScrollPosition(300)

  return (
    <>
      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        size="icon"
        className={cn(
          "fixed bottom-14 right-2 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
          "hover:scale-110 active:scale-95",
          isVisible 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ArrowUp className={iconSizes.md} />
      </Button>
    </>
  )
}
