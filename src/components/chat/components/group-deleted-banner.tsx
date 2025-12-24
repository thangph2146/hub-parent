/**
 * Banner hiển thị khi group đã bị xóa (trong input area)
 */

"use client"

import { forwardRef } from "react"
import { Flex } from "@/components/ui/flex"
import { TypographyPSmallMuted } from "@/components/ui/typography"

export const GroupDeletedBanner = forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <Flex 
        ref={ref} 
        align="center" 
        justify="center"
        padding="sm"
        border="bottom"
      >
        <TypographyPSmallMuted>
          Không thể gửi tin nhắn vì nhóm đã bị xóa
        </TypographyPSmallMuted>
      </Flex>
    )
  }
)

GroupDeletedBanner.displayName = "GroupDeletedBanner"