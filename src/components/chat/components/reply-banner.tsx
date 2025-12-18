/**
 * Banner hiển thị khi đang reply một message
 */

"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { typography, iconSizes } from "@/lib/typography"
import type { Message } from "../types"

interface ReplyBannerProps {
  replyingTo: Message
  onCancel: () => void
}

export function ReplyBanner({ replyingTo, onCancel }: ReplyBannerProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
      <div className="flex-1 min-w-0">
        <p className={`${typography.body.small} font-medium text-muted-foreground mb-0.5`}>Replying to:</p>
        <p className={`${typography.body.small} truncate`}>{replyingTo.content}</p>
      </div>
      <Button variant="ghost" size="icon" className={`${iconSizes.lg} shrink-0`} onClick={onCancel}>
        <X className={iconSizes.xs} />
      </Button>
    </div>
  )
}

