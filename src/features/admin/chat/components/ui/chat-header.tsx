"use client"

import { useState, useEffect, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardDescription, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Flex } from "@/components/ui/flex"
import { ArrowLeft, Search } from "lucide-react"
import { TypographyPSmall, TypographyP, IconSize } from "@/components/ui/typography"
import type { Contact, Message } from "../../types"
import { filterMessagesByQuery } from "../../utils/message-helpers"
import { MessageSearchSheet } from "./message-search-sheet"

interface ChatHeaderProps {
  contact: Contact
  onBack?: () => void
  showBackButton?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  currentMessages?: Message[]
  onScrollToMessage?: (messageId: string) => void
  groupManagementMenu?: React.ReactNode
}

export const ChatHeader = forwardRef<HTMLDivElement, ChatHeaderProps>(
function ChatHeader(
  { 
    contact, 
    onBack, 
    showBackButton = false,
    searchQuery = "",
    onSearchChange,
    currentMessages = [],
    onScrollToMessage,
    groupManagementMenu,
  }: ChatHeaderProps,
  ref,
) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Sync local state with prop
  useEffect(() => {
    if (!isSearchOpen && searchQuery) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setIsSearchOpen(true), 0)
    }
  }, [searchQuery, isSearchOpen])

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value)
  }

  const handleCloseSearch = () => {
    onSearchChange?.("")
    setIsSearchOpen(false)
  }

  // Filter messages by search query
  const filteredMessages = filterMessagesByQuery(currentMessages, searchQuery)

  const handleMessageClick = (messageId: string) => {
    onScrollToMessage?.(messageId)
    setIsSearchOpen(false)
    onSearchChange?.("")
  }

  return (
    <>
      <Flex 
        ref={ref} 
        align="center" 
        gap={3} 
        padding="md"
        fullWidth
        height="16"
        border="bottom"
        shrink
      >
        {showBackButton && onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <IconSize size="sm"><ArrowLeft /></IconSize>
          </Button>
        )}
        <Flex shrink>
          <Avatar size="xl">
            <AvatarImage src={contact.image || undefined} alt={contact.name} />
            <AvatarFallback asChild>
              <TypographyPSmall>{contact.name[0]}</TypographyPSmall>
            </AvatarFallback>
          </Avatar>
        </Flex>
        <Flex direction="col" fullWidth minWidth="0" gap={0.5}>
          <CardTitle>
            <TypographyP>{contact.name}</TypographyP>
          </CardTitle>
          <CardDescription>
            <TypographyPSmall>
              {contact.type === "GROUP" ? `${contact.group?.memberCount || 0} thành viên` : "Contact Info"}
            </TypographyPSmall>
          </CardDescription>
        </Flex>
        <Flex align="center" gap={1} shrink>
          {contact.type === "GROUP" && groupManagementMenu}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSearchOpen(true)}
          >
            <IconSize size="sm"><Search /></IconSize>
          </Button>
        </Flex>
      </Flex>
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Tìm kiếm tin nhắn</SheetTitle>
          </SheetHeader>
          <MessageSearchSheet
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClose={handleCloseSearch}
            messages={filteredMessages}
            onMessageClick={handleMessageClick}
          />
        </SheetContent>
      </Sheet>
    </>
  )
})

ChatHeader.displayName = "ChatHeader"

