/**
 * Reusable message search sheet component
 */

"use client"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Search, X } from "lucide-react"
import { TypographyP, TypographyPSmallMuted, TypographyPMuted, IconSize } from "@/components/ui/typography"
import type { Message } from "../types"
import { formatMessageTime } from "../utils"
import { highlightText } from "../utils/text-helpers"

interface MessageSearchSheetProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onClose: () => void
  messages: Message[]
  onMessageClick: (messageId: string) => void
}

export function MessageSearchSheet({
  searchQuery,
  onSearchChange,
  onClose,
  messages,
  onMessageClick,
}: MessageSearchSheetProps) {
  return (
    <Flex direction="col" gap={4} className="mt-4 p-4">
      <div className="relative">
        <IconSize size="sm" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"><Search /></IconSize>
        <Input
          placeholder="Nhập từ khóa để tìm kiếm..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={onClose}
          >
            <IconSize size="sm"><X /></IconSize>
          </Button>
        )}
      </div>
      {searchQuery && (
        <TypographyPMuted>
          Tìm thấy {messages.length} tin nhắn
        </TypographyPMuted>
      )}
      {searchQuery && messages.length > 0 && (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2 pr-4">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => onMessageClick(message.id)}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent/10 transition-colors"
              >
                <Flex align="start" gap={2}>
                  <div className="flex-1 min-w-0">
                    <TypographyPSmallMuted className="mb-1">
                      {formatMessageTime(message.timestamp)}
                    </TypographyPSmallMuted>
                    <TypographyP className="break-words">
                      {highlightText(message.content, searchQuery)}
                    </TypographyP>
                  </div>
                </Flex>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
      {searchQuery && messages.length === 0 && (
        <Flex direction="col" align="center" justify="center" className="py-8 text-center">
          <TypographyPMuted>Không tìm thấy tin nhắn nào</TypographyPMuted>
          <TypographyPSmallMuted className="mt-1">Thử tìm kiếm với từ khóa khác</TypographyPSmallMuted>
        </Flex>
      )}
    </Flex>
  )
}