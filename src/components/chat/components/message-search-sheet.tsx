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
    <Flex direction="col" gap={4} padding="md">
      <Flex position="relative" align="center" fullWidth>
        <IconSize size="sm">
          <Search />
        </IconSize>
        <Input
          placeholder="Nhập từ khóa để tìm kiếm..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <IconSize size="sm"><X /></IconSize>
          </Button>
        )}
      </Flex>
      {searchQuery && (
        <TypographyPMuted>
          Tìm thấy {messages.length} tin nhắn
        </TypographyPMuted>
      )}
      {searchQuery && messages.length > 0 && (
        <ScrollArea>
          <Flex direction="col" gap={2} padding="responsive">
            {messages.map((message) => (
              <Flex
                key={message.id}
                as="button"
                onClick={() => onMessageClick(message.id)}
                fullWidth
                textAlign="left"
                rounded="lg"
                border="all"
                hover="accent-10"
                cursor="pointer"
              >
                <Flex direction="col" gap={1} align="start" padding="md">
                  <TypographyPSmallMuted>
                    {formatMessageTime(message.timestamp)}
                  </TypographyPSmallMuted>
                  <TypographyP>
                    {highlightText(message.content, searchQuery)}
                  </TypographyP>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </ScrollArea>
      )}
      {searchQuery && messages.length === 0 && (
        <Flex 
          direction="col" 
          align="center" 
          justify="center" 
          gap={1}
          padding="responsive-lg"
        >
          <TypographyPMuted>Không tìm thấy tin nhắn nào</TypographyPMuted>
          <TypographyPSmallMuted>Thử tìm kiếm với từ khóa khác</TypographyPSmallMuted>
        </Flex>
      )}
    </Flex>
  )
}