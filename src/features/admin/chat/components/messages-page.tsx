/**
 * Server Component: Messages Page
 * 
 * Fetches conversations và pass xuống client component
 * Pattern: Server Component (data fetching) → Client Component (UI/interactions)
 */

import { getAuthInfo } from "@/features/admin/resources/server/auth-helpers"
import { listConversationsCached, getMessagesBetweenUsersCached } from "../server/cache"
import { MessagesPageClient } from "./messages-page-client"
import type { Contact, Message } from "@/components/chat/types"

export async function MessagesPage() {
  const authInfo = await getAuthInfo()

  if (!authInfo.actorId) {
    return <div>Unauthorized</div>
  }

  const currentUserId = authInfo.actorId

  // Fetch conversations
  const conversationsResult = await listConversationsCached({
    userId: currentUserId,
    page: 1,
    limit: 50,
  })

  // Map conversations to Contact format
  const contacts: Contact[] = await Promise.all(
    conversationsResult.data.map(async (conv) => {
      // Fetch messages for each conversation
      const messages = await getMessagesBetweenUsersCached(currentUserId, conv.otherUser.id, 100)

      return {
        id: conv.otherUser.id,
        name: conv.otherUser.name || conv.otherUser.email,
        email: conv.otherUser.email,
        image: conv.otherUser.avatar,
        lastMessage: conv.lastMessage?.content || "",
        lastMessageTime: conv.lastMessage?.timestamp || conv.updatedAt,
        unreadCount: conv.unreadCount,
        isOnline: conv.otherUser.isOnline || false,
        messages: messages.map((msg): Message => ({
          id: msg.id,
          content: msg.content,
          subject: msg.subject,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          timestamp: msg.timestamp,
          isRead: msg.isRead,
          type: msg.type as Message["type"],
          parentId: msg.parentId,
        })),
      }
    })
  )

  return (
    <MessagesPageClient
      initialContacts={contacts}
      currentUserId={currentUserId}
      currentUserRole={authInfo.roles[0]?.name || null}
    />
  )
}

