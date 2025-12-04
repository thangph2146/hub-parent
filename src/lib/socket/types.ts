/**
 * Socket.IO Typed Events for v4.8.1
 * 
 * Định nghĩa types cho tất cả socket events để đảm bảo type safety
 * giữa client và server.
 */

import type { SocketNotificationPayload } from "./state"

/**
 * Client to Server Events
 * Events mà client gửi lên server
 */
export interface ClientToServerEvents {
  // Conversation events
  "join-conversation": (data: { a: string; b: string }) => void
  "leave-conversation": (data: { a: string; b: string }) => void

  // Message events
  "message:send": (
    data: {
      parentMessageId?: string
      content: string
      fromUserId: string
      toUserId: string
    },
    ack: (response: {
      success?: boolean
      error?: string
      messageId?: string
      notificationId?: string
    }) => void,
  ) => void

  // Notification events
  "notification:read": (data: { notificationId: string }) => void
  "notifications:mark-all-read": () => void

  // System events
  "system:notify": (data: {
    targetUserId?: string
    targetRole?: string
    notification: Omit<SocketNotificationPayload, "id" | "timestamp" | "read">
  }) => void
}

/**
 * Server to Client Events
 * Events mà server gửi xuống client
 */
export interface ServerToClientEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (error: Error) => void

  // Message events
  "message:new": (data: {
    id?: string
    parentMessageId?: string
    content: string
    fromUserId: string
    toUserId?: string
    timestamp?: number
    isRead?: boolean
    readers?: Array<{
      id: string
      name: string | null
      email: string
      avatar: string | null
    }>
  }) => void

  "message:updated": (data: {
    id?: string
    parentMessageId?: string
    content: string
    fromUserId: string
    toUserId?: string
    timestamp?: number
    isRead?: boolean
    readers?: Array<{
      id: string
      name: string | null
      email: string
      avatar: string | null
    }>
  }) => void

  // Notification events
  "notification:new": (data: SocketNotificationPayload) => void
  "notification:updated": (data: SocketNotificationPayload) => void
  "notification:admin": (data: SocketNotificationPayload) => void
  "notifications:sync": (data: SocketNotificationPayload[]) => void
  "notification:deleted": (data: { id?: string; notificationId?: string }) => void
  "notifications:deleted": (data: { ids?: string[]; notificationIds?: string[] }) => void

  // Contact request events
  "contact-request:new": (data: {
    id: string
    name: string
    email: string
    phone?: string | null
    subject: string
    status: string
    priority: string
    createdAt: string
    assignedToId?: string | null
  }) => void

  "contact-request:assigned": (data: {
    id: string
    name: string
    email: string
    phone?: string | null
    subject: string
    status: string
    priority: string
    createdAt: string
    assignedToId?: string | null
  }) => void
}

/**
 * Socket Data (Auth data sent during handshake)
 */
export interface SocketData {
  userId: string
  role?: string
}

/**
 * Socket Inter-server Events (for scaling with Redis adapter)
 */
export interface InterServerEvents {
  ping: () => void
}

/**
 * Socket Server Config
 */
export interface SocketServerConfig {
  path: string
  cors: {
    origin: boolean | string | string[]
    credentials: boolean
    methods: string[]
  }
  transports: string[]
  allowEIO3: boolean
  maxHttpBufferSize: number
  pingTimeout: number
  pingInterval: number
  upgradeTimeout: number
}

