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
import { ArrowLeft, Search } from "lucide-react"
import { TypographyPSmall, TypographyP, IconSize } from "@/components/ui/typography"
import type { Contact, Message } from "../types"
import { filterMessagesByQuery } from "../utils/message-helpers"
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
      <div ref={ref} className="flex items-center gap-3 h-16 px-4 border-b shrink-0">
        {showBackButton && onBack && (
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onBack}>
            <IconSize size="sm"><ArrowLeft /></IconSize>
          </Button>
        )}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={contact.image || undefined} alt={contact.name} />
          <AvatarFallback asChild>
            <TypographyPSmall>{contact.name[0]}</TypographyPSmall>
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle>
            <TypographyP className="font-semibold truncate">{contact.name}</TypographyP>
          </CardTitle>
          <CardDescription>
            <TypographyPSmall className="truncate">
              {contact.type === "GROUP" ? `${contact.group?.memberCount || 0} thành viên` : "Contact Info"}
            </TypographyPSmall>
          </CardDescription>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {contact.type === "GROUP" && groupManagementMenu}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10"
            onClick={() => setIsSearchOpen(true)}
          >
            <IconSize size="sm"><Search /></IconSize>
          </Button>
        </div>
      </div>
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
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

