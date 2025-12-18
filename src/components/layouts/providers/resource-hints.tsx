"use client"

import { useEffect } from "react"

/**
 * Resource Hints Component
 * 
 * Injects preconnect and dns-prefetch links for performance optimization.
 * This is needed because Next.js App Router doesn't support <head> tags directly in layouts.
 */
export function ResourceHints() {
  useEffect(() => {
    // Check if links already exist
    const existingPreconnect = document.querySelector(
      'link[rel="preconnect"][href="https://fileserver2.hub.edu.vn"]'
    )
    const existingDnsPrefetch = document.querySelector(
      'link[rel="dns-prefetch"][href="https://fileserver2.hub.edu.vn"]'
    )

    if (!existingPreconnect) {
      const preconnectLink = document.createElement("link")
      preconnectLink.rel = "preconnect"
      preconnectLink.href = "https://fileserver2.hub.edu.vn"
      preconnectLink.crossOrigin = "anonymous"
      document.head.appendChild(preconnectLink)
    }

    if (!existingDnsPrefetch) {
      const dnsPrefetchLink = document.createElement("link")
      dnsPrefetchLink.rel = "dns-prefetch"
      dnsPrefetchLink.href = "https://fileserver2.hub.edu.vn"
      document.head.appendChild(dnsPrefetchLink)
    }
  }, [])

  return null
}

