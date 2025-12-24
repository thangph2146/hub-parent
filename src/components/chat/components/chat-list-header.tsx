"use client"

import { TypographyH3 } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import type { Contact } from "../types"

export type ChatFilterType = "ACTIVE" | "DELETED"

interface ChatListHeaderProps {
  onNewConversation?: (contact: Contact) => void // Deprecated: sử dụng newConversationDialog thay thế
  existingContactIds?: string[] // Deprecated: sử dụng newConversationDialog thay thế
  newConversationDialog?: React.ReactNode // Cho phép inject business component từ bên ngoài
  newGroupDialog?: React.ReactNode // Cho phép inject group dialog từ bên ngoài
  filterType?: ChatFilterType
  onFilterChange?: (filter: ChatFilterType) => void
}

export function ChatListHeader({ 
  onNewConversation: _onNewConversation, 
  existingContactIds: _existingContactIds, 
  newConversationDialog,
  newGroupDialog,
}: ChatListHeaderProps) {
  return (
    <Flex align="center" justify="between" className="h-16 px-4 border-b shrink-0">
      <TypographyH3>Chats</TypographyH3>
      <Flex align="center" gap={2} className="shrink-0">
        {newConversationDialog}
        {newGroupDialog}
      </Flex>
    </Flex>
  )
}

