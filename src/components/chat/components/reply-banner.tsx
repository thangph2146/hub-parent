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
    <Flex align="center" justify="between" gap={2} className="px-4 py-2 bg-muted/50 border-b">
      <Flex direction="col" className="flex-1 min-w-0">
        <TypographyPSmallMuted>Replying to:</TypographyPSmallMuted>
        <TypographyPSmall className="truncate">{replyingTo.content}</TypographyPSmall>
      </Flex>
      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={onCancel}>
        <IconSize size="xs"><X /></IconSize>
      </Button>
    </Flex>
  )
}

