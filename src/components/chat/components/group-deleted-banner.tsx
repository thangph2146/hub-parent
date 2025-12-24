/**
 * Banner hiển thị khi group đã bị xóa (trong input area)
 */

"use client"

import { forwardRef } from "react"
import { Flex } from "@/components/ui/flex"
import { TypographyPSmall } from "@/components/ui/typography"

export const GroupDeletedBanner = forwardRef<HTMLDivElement>(
  (props, ref) => {
    return (
      <Flex 
        ref={ref} 
        align="center" 
        justify="center"
        padding="sm"
        className="bg-muted/50 border-b"
      >
        <TypographyPSmall className="text-muted-foreground text-center">
          Không thể gửi tin nhắn vì nhóm đã bị xóa
        </TypographyPSmall>
      </Flex>
    )
  }
)

GroupDeletedBanner.displayName = "GroupDeletedBanner"