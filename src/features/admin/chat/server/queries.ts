/**
 * Non-cached Database Queries for Messages/Chat
 * 
 * Chứa các database queries không có cache wrapper
 * Sử dụng cho các trường hợp cần fresh data hoặc trong API routes
 */

import { prisma } from "@/lib/database"
import { mapMessageRecord } from "./helpers"

export interface ListConversationsInput {
  userId: string
  page?: number
  limit?: number
  search?: string
}

export interface ConversationListItem {
  id: string
  otherUser: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    isOnline?: boolean
  }
  lastMessage: {
    id: string
    content: string
    timestamp: Date
    senderId: string | null
    isRead: boolean
  } | null
  unreadCount: number
  updatedAt: Date
}

export interface ListConversationsResult {
  data: ConversationListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface MessageDetail {
  id: string
  content: string
  subject: string
  senderId: string | null
  receiverId: string
  timestamp: Date
  isRead: boolean
  type: string
  parentId: string | null
  parent?: MessageDetail | null
  sender?: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  } | null
  receiver: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
}

/**
 * List conversations for a user
 * Returns unique conversations between the user and others
 */
export async function listConversations(params: ListConversationsInput): Promise<ListConversationsResult> {
  const { userId, page = 1, limit = 50 } = params

  // Get distinct conversation partners
  const [sentMessages, receivedMessages] = await Promise.all([
    prisma.message.findMany({
      where: {
        senderId: userId,
        deletedAt: null,
      },
      select: {
        receiverId: true,
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      distinct: ["receiverId"],
    }),
    prisma.message.findMany({
      where: {
        receiverId: userId,
        deletedAt: null,
      },
      select: {
        senderId: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      distinct: ["senderId"],
    }),
  ])

  // Combine and deduplicate conversation partners
  const conversationMap = new Map<string, ConversationListItem>()

  // Process sent messages
  sentMessages.forEach((msg) => {
    if (msg.receiverId && msg.receiver) {
      const key = msg.receiverId
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          otherUser: {
            id: msg.receiver.id,
            name: msg.receiver.name,
            email: msg.receiver.email,
            avatar: msg.receiver.avatar,
          },
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date(),
        })
      }
    }
  })

  // Process received messages
  receivedMessages.forEach((msg) => {
    if (msg.senderId && msg.sender) {
      const key = msg.senderId
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          otherUser: {
            id: msg.sender.id,
            name: msg.sender.name,
            email: msg.sender.email,
            avatar: msg.sender.avatar,
          },
          lastMessage: null,
          unreadCount: 0,
          updatedAt: new Date(),
        })
      }
    }
  })

  // Get last message and unread count for each conversation
  const conversationIds = Array.from(conversationMap.keys())
  const conversations = await Promise.all(
    conversationIds.map(async (otherUserId) => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
            deletedAt: null,
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        }),
        prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
            deletedAt: null,
          },
        }),
      ])

      const conversation = conversationMap.get(otherUserId)!
      conversation.lastMessage = lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            isRead: lastMessage.isRead,
          }
        : null
      conversation.unreadCount = unreadCount
      conversation.updatedAt = lastMessage?.createdAt || conversation.updatedAt

      return conversation
    })
  )

  // Sort by updatedAt desc
  conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  // Apply pagination
  const total = conversations.length
  const totalPages = Math.ceil(total / limit)
  const paginatedConversations = conversations.slice((page - 1) * limit, page * limit)

  return {
    data: paginatedConversations,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

/**
 * Get messages between two users
 */
export async function getMessagesBetweenUsers(
  userId: string,
  otherUserId: string,
  limit: number = 100
): Promise<MessageDetail[]> {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      deletedAt: null,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      parent: {
        select: {
          id: true,
          content: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
          isRead: true,
          type: true,
          parentId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  })

  return messages.map(mapMessageRecord)
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string): Promise<MessageDetail | null> {
  const message = await prisma.message.findUnique({
    where: { id },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      parent: {
        select: {
          id: true,
          content: true,
          senderId: true,
          receiverId: true,
          createdAt: true,
          isRead: true,
          type: true,
          parentId: true,
        },
      },
    },
  })

  if (!message) {
    return null
  }

  return mapMessageRecord(message)
}

// Re-export helpers
export { mapMessageRecord, mapConversationRecord, type MessageWithRelations } from "./helpers"

