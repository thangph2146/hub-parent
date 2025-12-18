"use client"

import { headerConfig } from "@/lib/typography"
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
    <div className="flex items-center justify-between h-16 px-4 border-b shrink-0">
      <h2 className={headerConfig.subsection.className}>Chats</h2>
      <div className="flex items-center gap-2 shrink-0 mr-8">
        {newConversationDialog}
        {newGroupDialog}
      </div>
    </div>
  )
}

