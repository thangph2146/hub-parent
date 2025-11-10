import { prisma } from "@/lib/database"
import type { MessageWithRelations } from "./queries"
import {
  ApplicationError,
  NotFoundError,
  type AuthContext,
} from "@/features/admin/resources/server"
import { getSocketServer } from "@/lib/socket/state"
import { logger } from "@/lib/config"

export interface CreateMessageInput {
  content: string
  subject?: string
  receiverId: string
  parentId?: string | null
  type?: "NOTIFICATION" | "ANNOUNCEMENT" | "PERSONAL" | "SYSTEM"
}

export interface MarkMessagesAsReadInput {
  messageIds: string[]
  userId: string
}

/**
 * Create a new message
 */
export async function createMessage(ctx: AuthContext, input: CreateMessageInput): Promise<MessageWithRelations> {
  if (!input.content || !input.receiverId) {
    throw new ApplicationError("Content và receiverId là bắt buộc", 400)
  }

  if (!ctx.actorId) {
    throw new ApplicationError("Unauthorized", 401)
  }

  // Verify receiver exists
  const receiver = await prisma.user.findUnique({
    where: { id: input.receiverId },
  })

  if (!receiver) {
    throw new NotFoundError("Người nhận không tồn tại")
  }

  // Verify parent message exists if provided
  if (input.parentId) {
    const parentMessage = await prisma.message.findUnique({
      where: { id: input.parentId },
    })

    if (!parentMessage) {
      throw new NotFoundError("Tin nhắn gốc không tồn tại")
    }
  }

  const message = await prisma.message.create({
    data: {
      content: input.content.trim(),
      subject: input.subject || "PERSONAL",
      senderId: ctx.actorId,
      receiverId: input.receiverId,
      parentId: input.parentId || null,
      type: input.type || "PERSONAL",
      isRead: false,
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
  })

  // Emit socket event (tương tự notifications pattern)
  const io = getSocketServer()
  if (io) {
    try {
      const payload = {
        id: message.id,
        parentMessageId: message.parentId || undefined,
        content: message.content,
        fromUserId: message.senderId || ctx.actorId,
        toUserId: message.receiverId,
        timestamp: message.createdAt.getTime(),
      }

      // Emit đến user rooms (tương tự notifications emit đến user:${userId})
      io.to(`user:${ctx.actorId}`).emit("message:new", payload)
      io.to(`user:${input.receiverId}`).emit("message:new", payload)
      
      logger.debug("Socket message:new emitted", {
        messageId: message.id,
        fromUserId: message.senderId,
        toUserId: message.receiverId,
      })
    } catch (error) {
      logger.error("Failed to emit socket message", error instanceof Error ? error : new Error(String(error)))
    }
  }

  return message
}

/**
 * Mark a single message as read
 */
export async function markMessageAsRead(ctx: AuthContext, messageId: string, userId: string) {
  if (!messageId || !userId) {
    throw new ApplicationError("Message ID and User ID are required", 400)
  }

  if (!ctx.actorId || ctx.actorId !== userId) {
    throw new ApplicationError("Unauthorized", 401)
  }

  // Verify message exists and belongs to user
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, receiverId: true, isRead: true, senderId: true },
  })

  if (!message) {
    throw new NotFoundError("Message not found")
  }

  if (message.receiverId !== userId) {
    throw new ApplicationError("Forbidden: You can only mark your own received messages as read", 403)
  }

  // Skip update if already read
  if (message.isRead) {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true } },
    },
  })

  // Emit socket event (tương tự notifications)
  const io = getSocketServer()
  if (io) {
    try {
      const payload = {
        id: updated.id,
        parentMessageId: updated.parentId || undefined,
        content: updated.content,
        fromUserId: updated.senderId || "",
        toUserId: updated.receiverId,
        timestamp: updated.createdAt.getTime(),
        isRead: updated.isRead, // Include isRead status
      }
      io.to(`user:${userId}`).emit("message:updated", payload)
      logger.debug("Socket message:updated emitted", { messageId, userId })
    } catch (error) {
      logger.error("Failed to emit socket message update", error instanceof Error ? error : new Error(String(error)))
    }
  }

  return updated
}

/**
 * Mark a single message as unread
 */
export async function markMessageAsUnread(ctx: AuthContext, messageId: string, userId: string) {
  if (!messageId || !userId) {
    throw new ApplicationError("Message ID and User ID are required", 400)
  }

  if (!ctx.actorId || ctx.actorId !== userId) {
    throw new ApplicationError("Unauthorized", 401)
  }

  // Verify message exists and belongs to user
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { id: true, receiverId: true, isRead: true, senderId: true },
  })

  if (!message) {
    throw new NotFoundError("Message not found")
  }

  if (message.receiverId !== userId) {
    throw new ApplicationError("Forbidden: You can only mark your own received messages as unread", 403)
  }

  // Skip update if already unread
  if (!message.isRead) {
    return await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { isRead: false },
    include: {
      sender: { select: { id: true, name: true, email: true, avatar: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true } },
    },
  })

  // Emit socket event
  const io = getSocketServer()
  if (io) {
    try {
      const payload = {
        id: updated.id,
        parentMessageId: updated.parentId || undefined,
        content: updated.content,
        fromUserId: updated.senderId || "",
        toUserId: updated.receiverId,
        timestamp: updated.createdAt.getTime(),
        isRead: updated.isRead, // Include isRead status
      }
      io.to(`user:${userId}`).emit("message:updated", payload)
      logger.debug("Socket message:updated emitted", { messageId, userId })
    } catch (error) {
      logger.error("Failed to emit socket message update", error instanceof Error ? error : new Error(String(error)))
    }
  }

  return updated
}

/**
 * Mark messages as read (bulk)
 */
export async function markMessagesAsRead(ctx: AuthContext, input: MarkMessagesAsReadInput): Promise<{ count: number }> {
  if (!input.messageIds || input.messageIds.length === 0) {
    return { count: 0 }
  }

  if (!ctx.actorId || ctx.actorId !== input.userId) {
    throw new ApplicationError("Unauthorized", 401)
  }

  const result = await prisma.message.updateMany({
    where: {
      id: { in: input.messageIds },
      receiverId: input.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })

  // Emit socket events for updated messages
  if (result.count > 0) {
    const io = getSocketServer()
    if (io) {
      try {
        // Fetch full messages với isRead status
        const fullMessages = await prisma.message.findMany({
          where: {
            id: { in: input.messageIds },
            receiverId: input.userId,
          },
          select: { id: true, content: true, senderId: true, receiverId: true, parentId: true, createdAt: true, isRead: true },
          take: 50,
        })

        fullMessages.forEach((msg) => {
          const payload = {
            id: msg.id,
            parentMessageId: msg.parentId || undefined,
            content: msg.content,
            fromUserId: msg.senderId || "",
            toUserId: msg.receiverId,
            timestamp: msg.createdAt.getTime(),
            isRead: msg.isRead,
          }
          io.to(`user:${input.userId}`).emit("message:updated", payload)
        })

        logger.debug("Socket messages:updated emitted (bulk)", { userId: input.userId, count: fullMessages.length })
      } catch (error) {
        logger.error("Failed to emit socket messages update", error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  return { count: result.count }
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(
  ctx: AuthContext,
  userId: string,
  otherUserId: string
): Promise<{ count: number }> {
  if (!ctx.actorId || ctx.actorId !== userId) {
    throw new ApplicationError("Unauthorized", 401)
  }

  const result = await prisma.message.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: userId,
      isRead: false,
      deletedAt: null,
    },
    data: {
      isRead: true,
    },
  })

  // Emit socket events for updated messages
  if (result.count > 0) {
    const io = getSocketServer()
    if (io) {
      try {
        // Fetch updated messages để emit
        const updatedMessages = await prisma.message.findMany({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: true,
            deletedAt: null,
          },
          select: { id: true, content: true, senderId: true, receiverId: true, parentId: true, createdAt: true, isRead: true },
          orderBy: { createdAt: "desc" },
          take: 50, // Limit để tránh quá nhiều events
        })

        updatedMessages.forEach((msg) => {
          const payload = {
            id: msg.id,
            parentMessageId: msg.parentId || undefined,
            content: msg.content,
            fromUserId: msg.senderId || "",
            toUserId: msg.receiverId,
            timestamp: msg.createdAt.getTime(),
            isRead: msg.isRead,
          }
          io.to(`user:${userId}`).emit("message:updated", payload)
        })

        logger.debug("Socket messages:updated emitted (conversation)", {
          userId,
          otherUserId,
          count: updatedMessages.length,
        })
      } catch (error) {
        logger.error("Failed to emit socket messages update", error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  return { count: result.count }
}

// Re-export for backward compatibility
export { ApplicationError, NotFoundError, type AuthContext }

