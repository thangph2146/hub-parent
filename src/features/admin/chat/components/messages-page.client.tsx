"use client"

import { ChatTemplate } from "./chat-template.client"
import { logger } from "@/utils"
import type { ChatFilterType, Contact, Message } from "@/features/admin/chat/types"
import { requestJson } from "@/services/api/client"
import { withApiBase } from "@/utils"

interface MessagesPageClientProps {
  initialContacts: Contact[]
  currentUserId: string
  currentUserRole?: string | null
  initialFilterType?: ChatFilterType
}

const MessagesPageClient = ({
  initialContacts,
  currentUserId,
  currentUserRole,
  initialFilterType = "ACTIVE",
}: MessagesPageClientProps) => {
  const handleNewConversation = async (contact: Contact) => {
    // Optionally fetch messages for new conversation
    try {
      const { apiRoutes } = await import("@/constants/api-routes")
      await requestJson(withApiBase(apiRoutes.adminConversations.list({ otherUserId: contact.id })))
      // Messages will be handled by the chat hook
    } catch (error) {
      logger.error("Error fetching messages for new conversation", error as Error)
    }
  }

  return (
    <ChatTemplate
      contacts={initialContacts}
      currentUserId={currentUserId}
      role={currentUserRole}
      initialFilterType={initialFilterType}
      onNewConversation={handleNewConversation}
    />
  )
}

export { MessagesPageClient }
export type { Contact, Message }
