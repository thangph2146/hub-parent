/**
 * Banner hiển thị khi đang reply một message
 */

"use client"

import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { X } from "lucide-react"
import { TypographyPSmall, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import type { Message } from "../types"

interface ReplyBannerProps {
  replyingTo: Message
  onCancel: () => void
}

export function ReplyBanner({ replyingTo, onCancel }: ReplyBannerProps) {
  return (
    <Flex 
      align="center" 
      justify="between" 
      gap={2} 
      padding="sm"
      fullWidth
      border="bottom"
    >
      <Flex direction="col" fullWidth minWidth="0" gap={0.5}>
        <TypographyPSmallMuted>Replying to:</TypographyPSmallMuted>
        <TypographyPSmall>{replyingTo.content}</TypographyPSmall>
      </Flex>
      <Button variant="ghost" size="icon" onClick={onCancel}>
        <IconSize size="xs"><X /></IconSize>
      </Button>
    </Flex>
  )
}

