/**
 * Banner hiển thị khi group đã bị xóa (trong input area)
 */

"use client"

import { forwardRef } from "react"
import { typography } from "@/lib/typography"

export const GroupDeletedBanner = forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <div ref={ref} className="px-4 py-2 bg-muted/50 border-b">
        <p className={`${typography.body.small} text-muted-foreground text-center`}>
          Không thể gửi tin nhắn vì nhóm đã bị xóa
        </p>
      </div>
    )
  }
)

GroupDeletedBanner.displayName = "GroupDeletedBanner"