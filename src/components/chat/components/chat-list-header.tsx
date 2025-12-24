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
}

export function ChatListHeader({ 
  onNewConversation: _onNewConversation, 
  existingContactIds: _existingContactIds, 
  newConversationDialog,
  newGroupDialog,
}: ChatListHeaderProps) {
  return (
    <Flex 
      align="center" 
      justify="between" 
      padding="md"
      fullWidth
      height="16"
      border="bottom"
      shrink
    >
      <TypographyH3>Chats</TypographyH3>
      <Flex align="center" gap={2} shrink margin="r-6-sm-0">
        {newConversationDialog}
        {newGroupDialog}
      </Flex>
    </Flex>
  )
}

