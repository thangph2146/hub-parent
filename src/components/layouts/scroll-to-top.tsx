"use client"

import { useScrollToTop } from "@/hooks/use-scroll-to-top"

/**
 * Client component to scroll to top when route or search params change
 * Should be added to root or admin layout
 */
export function ScrollToTop() {
  useScrollToTop()
  return null
}

