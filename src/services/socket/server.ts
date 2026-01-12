import { Server as IOServer, type Socket } from "socket.io"
import { NotificationKind, type Prisma } from "@prisma/client"
import { prisma } from "@/services/prisma"
import { logger } from "@/utils"
import { normalizeError } from "@/utils"
import {
  getNotificationCache,
  mapNotificationToPayload,
  storeNotificationInCache,
  MAX_IN_MEMORY_NOTIFICATIONS,
  type SocketNotificationPayload,
  type SocketNotificationKind,
} from "@/services/socket/state"
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@/services/socket/types"

const notificationCache = getNotificationCache()

const userRoom = (userId: string) => `user:${userId}`
const roleRoom = (role: string) => `role:${role}`

const conversationRoom = (a: string, b: string) => {
  const [x, y] = [a, b].sort()
  return `conversation:${x}:${y}`
}

const randomNotificationId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

type JsonValue = Prisma.InputJsonValue
type JsonObject = Prisma.InputJsonObject

const toJsonValue = (value: Record<string, unknown> | null | undefined): JsonValue | null | undefined => {
  if (value == null) return value ?? null
  return value as JsonValue
}

const normalizeKind = (kind?: string | NotificationKind | null): NotificationKind => {
  if (!kind) return NotificationKind.MESSAGE
  const normalized = String(kind).toUpperCase() as NotificationKind
  if ((Object.values(NotificationKind) as string[]).includes(normalized)) {
    return normalized
  }
  return NotificationKind.MESSAGE
}

const mapKindToClient = (kind: NotificationKind): SocketNotificationKind =>
  kind.toLowerCase() as SocketNotificationKind

const persistNotificationForUser = async ({
  userId,
  title,
  description,
  actionUrl,
  kind,
  metadata,
}: {
  userId: string
  title: string
  description?: string
  actionUrl?: string
  kind?: string | NotificationKind
  metadata?: JsonValue | null
}) =>
  prisma.notification.create({
    data: {
      userId,
      title,
      description,
      actionUrl,
      kind: normalizeKind(kind),
      metadata: metadata ?? undefined,
    },
  })

const createNotificationsForRole = async (
  roleName: string,
  notification: {
    title: string
    description?: string
    actionUrl?: string
    kind?: string | NotificationKind
    metadata?: JsonValue | null
  },
) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      userRoles: {
        some: {
          role: {
            name: roleName,
          },
        },
      },
    },
    select: { id: true },
  })

  if (users.length === 0) {
    return 0
  }

  const normalizedKind = normalizeKind(notification.kind)

  const payloads = users.map((user) => ({
    userId: user.id,
    title: notification.title,
    description: notification.description,
    actionUrl: notification.actionUrl,
    kind: normalizedKind,
    metadata: notification.metadata ?? undefined,
  }))

  await prisma.notification.createMany({ data: payloads })

  users.forEach((user) => {
    storeNotificationInCache(user.id, {
      id: randomNotificationId("role"),
      kind: mapKindToClient(normalizedKind),
      title: notification.title,
      description: notification.description,
      toUserId: user.id,
      timestamp: Date.now(),
      read: false,
      actionUrl: notification.actionUrl,
    })
  })

  return users.length
}

const ensureUserNotificationsCached = async (userId: string) => {
  if (notificationCache.has(userId)) {
    logger.debug("Cache hit for user notifications", { userId })
    return
  }

  logger.debug("Loading notifications from database", { userId })
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: MAX_IN_MEMORY_NOTIFICATIONS,
    })

    if (notifications.length > 0) {
      notificationCache.set(userId, notifications.map(mapNotificationToPayload))
      logger.success("Loaded notifications into cache", {
        userId,
        count: notifications.length,
      })
    } else {
      notificationCache.set(userId, [])
      logger.debug("No notifications found for user", { userId })
    }
  } catch (error) {
    logger.error("Failed to load notifications for user", normalizeError(error))
    notificationCache.set(userId, [])
  }
}

/**
 * Helper to acknowledge socket callback with error
 */
const ackError = (
  ack: ((response: { success?: boolean; error?: string; messageId?: string; notificationId?: string }) => void) | undefined,
  error: string
): void => {
  if (ack && typeof ack === "function") {
    ack({ error })
  }
}

export const setupSocketHandlers = async (
  io: IOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
  logger.info("Setting up Socket.IO handlers", {
    action: "socket_handlers_setup",
  })

  io.engine.on("connection_error", (err) => {
    const error = err as unknown as {
      message?: string
      code?: string | number
      req?: { url?: string | null }
      context?: Record<string, unknown>
    }

    // Get active socket connections count instead of accessing protected clients property
    const activeConnectionsCount = io.sockets.sockets.size

    logger.error("Socket engine connection error", {
      message: error.message ?? "unknown",
      code: error.code ?? null,
      requestUrl: error.req?.url ?? null,
      context: error.context ?? null,
      activeConnectionsCount,
    })
  })

  io.on("connection", async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    const auth = socket.handshake.auth as SocketData
    const userId = auth?.userId
    const role = auth?.role
    const socketId = socket.id

    logger.success("New client connected", {
      action: "socket_client_connected",
      socketId,
      userId: userId || "anonymous",
      role: role ?? null,
      transport: socket.conn.transport.name,
      remoteAddress: socket.handshake.address,
    })

    socket.conn.on("upgrade", (transport) => {
      logger.info("Engine transport upgraded", {
        socketId,
        userId: userId || "anonymous",
        newTransport: transport.name,
      })
    })

    socket.conn.on("upgradeError", (error) => {
      logger.error("Engine transport upgrade error", {
        socketId,
        userId: userId || "anonymous",
        transport: socket.conn.transport?.name ?? null,
        message: (error as Error)?.message ?? String(error),
      })
    })

    socket.conn.on("error", (error) => {
      logger.error("Engine transport error", {
        socketId,
        userId: userId || "anonymous",
        transport: socket.conn.transport?.name ?? null,
        message: (error as Error)?.message ?? String(error),
      })
    })

    socket.conn.on("close", (reason) => {
      logger.warn("Engine transport closed", {
        socketId,
        userId: userId || "anonymous",
        transport: socket.conn.transport?.name ?? null,
        reason,
      })
    })

    if (userId) {
      const userRoomName = userRoom(userId)
      socket.join(userRoomName)
      logger.info("Socket joined user room", { socketId, userId, room: userRoomName })

      await ensureUserNotificationsCached(userId)
      const userNotifications = notificationCache.get(userId) ?? []
      if (userNotifications.length > 0) {
        socket.emit("notifications:sync", userNotifications)
        logger.debug("Synced notifications to user", {
          socketId,
          userId,
          count: userNotifications.length,
        })
      } else {
        logger.debug("No notifications to sync for user", { socketId, userId })
      }
    } else {
      logger.warn("Client connected without userId", { socketId })
    }

    if (role) {
      const roleRoomName = roleRoom(role)
      socket.join(roleRoomName)
      logger.info("Socket joined role room", { socketId, role, room: roleRoomName })
    }

    socket.on("join-conversation", ({ a, b }: { a: string; b: string }) => {
      const room = conversationRoom(a, b)
      socket.join(room)
      logger.info("Socket joined conversation room", {
        socketId,
        userId,
        room,
        participants: [a, b],
      })
    })

    socket.on("leave-conversation", ({ a, b }: { a: string; b: string }) => {
      const room = conversationRoom(a, b)
      socket.leave(room)
      logger.info("Socket left conversation room", {
        socketId,
        userId,
        room,
        participants: [a, b],
      })
    })

    socket.on(
      "message:send",
      async (
        {
          parentMessageId,
          content,
          fromUserId,
          toUserId,
        }: {
          parentMessageId?: string
          content: string
          fromUserId: string
          toUserId: string
        },
        ack?: (response: { success?: boolean; error?: string; messageId?: string; notificationId?: string }) => void,
      ) => {
        // Validate required fields
        if (!content || !fromUserId || !toUserId) {
          logger.warn("Invalid message:send payload", {
            socketId,
            hasContent: !!content,
            hasFromUserId: !!fromUserId,
            hasToUserId: !!toUserId,
          })
          ackError(ack, "Invalid payload")
          return
        }

        // Validate content length
        if (content.length > 10000) {
          logger.warn("Message content too long", {
            socketId,
            fromUserId,
            contentLength: content.length,
            maxLength: 10000,
          })
          ackError(ack, "Message content too long")
          return
        }

        const room = conversationRoom(fromUserId, toUserId)
        logger.info("Received message", {
          socketId,
          fromUserId,
          toUserId,
          room,
          contentLength: content.length,
          hasParent: !!parentMessageId,
        })

        const isFromAdmin = fromUserId.includes("admin") || fromUserId.startsWith("cmh8leuua")
        const getActionUrl = (messageId: string) =>
          isFromAdmin ? `/parents/messages/${messageId}` : `/admin/messages/${messageId}`

        let persistedId: string | null = null
        let persistedPayload: SocketNotificationPayload | null = null
        let actionUrl = getActionUrl(parentMessageId ?? "")
        const messageMetadata: JsonObject = parentMessageId
          ? { fromUserId, parentMessageId }
          : { fromUserId }

        try {
          const created = await persistNotificationForUser({
            userId: toUserId,
            title: "Bạn có tin nhắn mới",
            description: content.length > 50 ? `${content.substring(0, 50)}...` : content,
            actionUrl,
            kind: NotificationKind.MESSAGE,
            metadata: messageMetadata,
          })
          persistedId = created.id
          persistedPayload = mapNotificationToPayload(created)
          actionUrl = persistedPayload.actionUrl ?? actionUrl
          logger.debug("Notification persisted to database", {
            notificationId: persistedId,
            toUserId,
          })
        } catch (error) {
          logger.error("Failed to persist notification", normalizeError(error))
        }

        const notification: SocketNotificationPayload =
          persistedPayload ?? {
            id: persistedId ?? randomNotificationId("msg"),
            kind: "message",
            title: "Bạn có tin nhắn mới",
            description: content.length > 50 ? content.substring(0, 50) + "..." : content,
            fromUserId,
            toUserId,
            parentMessageId,
            timestamp: Date.now(),
            read: false,
            actionUrl,
          }

        storeNotificationInCache(toUserId, notification)

        // Emit message to conversation room
        const messagePayload = {
          parentMessageId,
          content,
          fromUserId,
          toUserId,
          timestamp: Date.now(),
        }
        io.to(room).emit("message:new", messagePayload)
        logger.success("Message broadcasted to conversation room", {
          room,
          fromUserId,
          toUserId,
        })

        // Emit notification to user
        io.to(userRoom(toUserId)).emit("notification:new", notification)
        logger.success("Notification sent to user room", {
          notificationId: notification.id,
          toUserId,
          room: userRoom(toUserId),
        })

        io.to(roleRoom("ADMIN")).emit("notification:admin", {
          ...notification,
          title: "Tin nhắn mới từ phụ huynh",
          description: `Phụ huynh đã gửi tin nhắn: ${notification.description}`,
        })
        logger.debug("Admin notification sent", {
          room: roleRoom("ADMIN"),
        })

        // Acknowledge success sau khi đã hoàn thành tất cả operations
        // Socket.IO v4 retry mechanism - client sẽ retry nếu không nhận được ack
        if (ack && typeof ack === "function") {
          ack({
            success: true,
            messageId: persistedId ?? undefined,
            notificationId: notification.id,
          })
        }
      },
    )

    socket.on(
      "notification:read",
      ({ notificationId }: { notificationId: string }) => {
        if (!userId) {
          logger.warn("notification:read called without userId", { socketId })
          return
        }

        if (!notificationId) {
          logger.warn("notification:read called without notificationId", { socketId, userId })
          return
        }

        const userNotifications = notificationCache.get(userId) || []
        const notification = userNotifications.find((n) => n.id === notificationId)
        if (!notification) {
          logger.warn("Notification not found in cache", { 
            socketId, 
            userId, 
            notificationId,
            cacheSize: userNotifications.length,
          })
          return
        }

        // QUAN TRỌNG: Chỉ cho phép mark read nếu notification thuộc về user này
        if (notification.toUserId !== userId) {
          logger.warn("User attempted to mark notification as read without ownership", {
            socketId,
            userId,
            notificationId,
            notificationToUserId: notification.toUserId,
          })
          return
        }

        notification.read = true
        io.to(userRoom(userId)).emit("notification:updated", notification)
        logger.debug("Notification marked as read", {
          socketId,
          userId,
          notificationId,
        })
      },
    )

    socket.on("notifications:mark-all-read", () => {
      if (!userId) {
        logger.warn("notifications:mark-all-read called without userId", { socketId })
        return
      }

      const userNotifications = notificationCache.get(userId) || []
      
      // QUAN TRỌNG: Chỉ mark notifications thuộc về user này
      // Filter để chỉ lấy notifications có toUserId === userId hiện tại
      // (không mark SYSTEM notifications hoặc notifications của user khác)
      const ownNotifications = userNotifications.filter((n) => n.toUserId === userId)
      const unreadCount = ownNotifications.filter((n) => !n.read).length
      
      if (unreadCount === 0) {
        logger.debug("No unread notifications to mark", { 
          socketId, 
          userId,
          totalInCache: userNotifications.length,
          ownNotifications: ownNotifications.length,
        })
        return
      }

      // Chỉ mark notifications thuộc về user này
      ownNotifications.forEach((n) => (n.read = true))
      
      // Emit sync với tất cả notifications (bao gồm cả SYSTEM nếu có)
      // nhưng chỉ mark read những notifications của user
      io.to(userRoom(userId)).emit("notifications:sync", userNotifications)
      logger.info("All own notifications marked as read", {
        socketId,
        userId,
        totalInCache: userNotifications.length,
        ownNotifications: ownNotifications.length,
        unreadCount,
        markedCount: unreadCount,
      })
    })

    socket.on(
      "system:notify",
      async ({
        targetUserId,
        targetRole,
        notification,
      }: {
        targetUserId?: string
        targetRole?: string
        notification: Omit<SocketNotificationPayload, "id" | "timestamp" | "read">
      }) => {
        logger.info("System notification requested", {
          socketId,
          targetUserId,
          targetRole,
          notificationTitle: notification.title,
        })

        const systemNotification: SocketNotificationPayload = {
          ...notification,
          id: randomNotificationId("sys"),
          timestamp: Date.now(),
          read: false,
        }

        if (targetUserId) {
          storeNotificationInCache(targetUserId, systemNotification)
          io.to(userRoom(targetUserId)).emit("notification:new", systemNotification)
          logger.success("System notification sent to user", {
            notificationId: systemNotification.id,
            targetUserId,
          })

          try {
            await persistNotificationForUser({
              userId: targetUserId,
              title: systemNotification.title,
              description: systemNotification.description ?? undefined,
              actionUrl: systemNotification.actionUrl ?? undefined,
              kind: systemNotification.kind,
              metadata: toJsonValue(systemNotification.metadata) ?? undefined,
            })
            logger.debug("System notification persisted to database", {
              notificationId: systemNotification.id,
              targetUserId,
            })
          } catch (error) {
            logger.error("Failed to persist system notification", normalizeError(error))
          }
        }

        if (targetRole) {
          io.to(roleRoom(targetRole)).emit("notification:new", systemNotification)
          logger.success("System notification sent to role room", {
            notificationId: systemNotification.id,
            targetRole,
            room: roleRoom(targetRole),
          })

          try {
            const count = await createNotificationsForRole(targetRole, {
              title: systemNotification.title,
              description: systemNotification.description ?? undefined,
              actionUrl: systemNotification.actionUrl ?? undefined,
              kind: systemNotification.kind,
              metadata: toJsonValue(systemNotification.metadata),
            })
            logger.debug("System notifications persisted for role", {
              notificationId: systemNotification.id,
              targetRole,
              userCount: count,
            })
          } catch (error) {
            logger.error("Failed to persist notifications for role", normalizeError(error))
          }
        }
      },
    )

    socket.on("disconnect", (reason) => {
      logger.info("Client disconnected", {
        socketId,
        userId,
        reason,
      })
    })
  })
}


