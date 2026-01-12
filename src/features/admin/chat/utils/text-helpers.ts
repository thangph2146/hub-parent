/**
 * Text utility functions
 */

import React from "react"
import { cn } from "@/utils"

/**
 * Highlight search query in text
 * Sử dụng mark tag với style từ UI components
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"))
  
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      React.createElement(
        "mark", 
        { 
          key: index, 
          className: cn("bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded")
        }, 
        part
      )
    ) : (
      part
    )
  )
}

