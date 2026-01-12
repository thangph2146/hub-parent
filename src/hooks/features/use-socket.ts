"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { logger } from "@/utils"
import { withApiBase } from "@/utils"
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@/services/socket/types"

export interface UseSocketOptions {
  userId?: string | null
  role?: string | null
}

export interface SocketMessagePayload {
  id?: string // Message ID từ database (nếu có)
  parentMessageId?: string
  content: string
  fromUserId: string
  toUserId?: string // Nullable for group messages
  groupId?: string // For group messages
  timestamp?: number
  isRead?: boolean // Include isRead status for message:updated events
  readers?: {
    // List of users who have read this message (for group messages)
    id: string
    name: string | null
    email: string
    avatar: string | null
  }[]
}

export interface SocketNotificationPayload {
  id: string
  kind: string
  title: string
  description?: string
  fromUserId?: string
  toUserId?: string
  parentMessageId?: string
  timestamp?: number
  read?: boolean
  actionUrl?: string
  metadata?: Record<string, unknown> | null
}

export interface SocketConversationPair {
  a: string
  b: string
}

export interface SocketContactRequestPayload {
  id: string
  name: string
  email: string
  phone?: string | null
  subject: string
  status: string
  priority: string
  createdAt: string
  assignedToId?: string | null
}

type EventHandler = (...args: unknown[]) => void

interface SocketAuthOptions {
  userId: string
  role?: string | null
}

class SocketManager {
  private socket: Socket | null = null
  private connectPromise: Promise<Socket | null> | null = null
  private readonly pendingHandlers = new Map<string, Set<EventHandler>>()
  private bootstrapPromise: Promise<boolean> | null = null
  private bootstrapRetryCount = 0
  private readonly MAX_BOOTSTRAP_RETRIES = 3
  private hasLoggedUnavailable = false
  private lastConnectionErrorKey: string | null = null
  private lastConnectionErrorAt = 0
  private lastAuth: SocketAuthOptions | null = null
  private isDisconnecting = false
  private lastReuseLogAt = 0
  private isConnecting = false // Flag để prevent multiple connection attempts
  private lastConnectAttemptAt = 0 // Track last connect attempt để debounce
  private readonly CONNECT_DEBOUNCE_MS = 1000 // Debounce 1s giữa các connection attempts

  getSocket(): Socket | null {
    return this.socket
  }

  withSocket(callback: (socket: Socket) => void): boolean {
    const active = this.socket
    if (!active || !active.connected) return false
    callback(active)
    return true
  }

  /**
   * Disconnect socket - chỉ gọi khi đăng xuất
   */
  disconnect(): void {
    this.isDisconnecting = true
    const active = this.socket
    if (active) {
      try {
        logger.info("Đang disconnect socket do đăng xuất")
        active.removeAllListeners()
        active.disconnect()
      } catch (error) {
        logger.warn(
          "Lỗi khi disconnect socket",
          error instanceof Error ? error : new Error(String(error)),
        )
      }
      this.socket = null
    }
    this.lastAuth = null
    this.connectPromise = null
    this.isDisconnecting = false
  }

  on<Args extends unknown[]>(event: string, handler: (...args: Args) => void): () => void {
    let handlers = this.pendingHandlers.get(event)
    if (!handlers) {
      handlers = new Set()
      this.pendingHandlers.set(event, handlers)
    }
    handlers.add(handler as EventHandler)

    const active = this.socket
    if (active) {
      active.on(event, handler as Parameters<Socket["on"]>[1])
    }

    return () => {
      const liveSocket = this.socket
      if (liveSocket) {
        liveSocket.off(event, handler as Parameters<Socket["off"]>[1])
      }

      const stored = this.pendingHandlers.get(event)
      if (!stored) return
      stored.delete(handler as EventHandler)
      if (stored.size === 0) {
        this.pendingHandlers.delete(event)
      }
    }
  }

  async connect(auth: SocketAuthOptions): Promise<Socket | null> {
    if (!auth.userId) return null

    // Nếu đang disconnect (đăng xuất), không connect lại
    if (this.isDisconnecting) {
      return null
    }

    // Nếu socket đã connected và cùng auth, giữ nguyên
    if (this.socket && this.socket.connected && this.isSameAuth(auth)) {
      // Chỉ log mỗi 5 giây một lần để tránh spam
      const now = Date.now()
      if (now - this.lastReuseLogAt > 5000) {
        logger.debug("Socket đã connected với cùng auth, giữ nguyên", {
          userId: auth.userId,
          socketId: this.socket.id,
        })
        this.lastReuseLogAt = now
      }
      return this.socket
    }

    // Nếu socket đã connected nhưng auth khác, chỉ cập nhật auth (không disconnect)
    if (this.socket && this.socket.connected && !this.isSameAuth(auth)) {
      logger.info("Auth thay đổi, giữ socket connection và cập nhật auth", {
        oldUserId: this.lastAuth?.userId,
        newUserId: auth.userId,
      })
      this.lastAuth = { userId: auth.userId, role: auth.role ?? null }
      return this.socket
    }

    // Nếu đang connecting, đợi promise hiện tại
    if (this.isConnecting && this.connectPromise) {
      return this.connectPromise.then((socket) => {
        // Kiểm tra lại auth sau khi connect xong
        if (socket && socket.connected && this.isSameAuth(auth)) {
          return socket
        }
        // Nếu auth đã thay đổi trong lúc đang connect, connect lại với auth mới
        if (!this.isSameAuth(auth)) {
          return this.connect(auth)
        }
        return socket // Return socket anyway even if disconnected, Manager will handle
      })
    }

    // Nếu có socket nhưng chưa connected và không đang connecting, đợi một chút
    // Có thể socket đang trong quá trình tự động reconnect của Socket.IO
    if (this.socket && !this.socket.connected && !this.isConnecting) {
      // Đợi tối đa 2s để socket connect (giảm từ 3s)
      for (let i = 0; i < 4; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (this.socket && this.socket.connected) {
          if (this.isSameAuth(auth)) {
            return this.socket
          }
          break
        }
      }
    }

    // Kiểm tra lại isConnecting sau khi await
    if (this.isConnecting && this.connectPromise) {
      return this.connectPromise
    }

    // Debounce connection attempts - tránh spam khi nhiều components gọi cùng lúc
    const now = Date.now()
    const timeSinceLastAttempt = now - this.lastConnectAttemptAt
    if (timeSinceLastAttempt < this.CONNECT_DEBOUNCE_MS && this.lastConnectAttemptAt > 0) {
      // Nếu đã có socket và cùng auth, cứ trả về dù chưa connected (Socket.IO sẽ tự reconnect)
      if (this.socket && this.isSameAuth(auth)) {
        return this.socket
      }
      
      // Log connection attempt debounced - chỉ log nếu thực sự cần tạo mới
      logger.debug("Connection attempt debounced", {
        userId: auth.userId,
        timeSinceLastAttempt,
        debounceMs: this.CONNECT_DEBOUNCE_MS,
      })
      
      // Wait for debounce period
      await new Promise((resolve) => setTimeout(resolve, this.CONNECT_DEBOUNCE_MS - timeSinceLastAttempt))
      
      // Check again after debounce
      if (this.socket && this.socket.connected && this.isSameAuth(auth)) {
        return this.socket
      }
    }

    this.lastConnectAttemptAt = now
    this.lastAuth = { userId: auth.userId, role: auth.role ?? null }
    this.isConnecting = true

    this.connectPromise = this.createSocket(auth)
      .then((socket) => {
        this.isConnecting = false
        return socket
      })
      .catch((error) => {
        this.isConnecting = false
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error("Không thể khởi tạo Socket.IO", err)
        return null
      })

    const socket = await this.connectPromise
    this.connectPromise = null
    return socket
  }

  private isSameAuth(auth: SocketAuthOptions): boolean {
    return (
      this.lastAuth?.userId === auth.userId &&
      (this.lastAuth?.role ?? null) === (auth.role ?? null)
    )
  }

  private async createSocket(auth: SocketAuthOptions): Promise<Socket | null> {
    const endpointAvailable = await this.ensureServerBootstrap()

    if (!endpointAvailable) {
      if (!this.hasLoggedUnavailable) {
        logger.warn("Socket endpoint không khả dụng – bỏ qua kết nối client")
        this.hasLoggedUnavailable = true
      }
      return null
    }

    const { apiRoutes } = await import("@/constants/api-routes")
    const socketPath = withApiBase(apiRoutes.socket)

    logger.info("Đang tạo socket connection", {
      action: "socket_connect_start",
      userId: auth.userId,
      role: auth.role,
      path: socketPath,
      transports: ["websocket", "polling"],
    })

    // Socket.IO client configuration
    // socketPath should be "/api/socket" (full path)
    // io() first arg is URL (optional), if not provided uses current origin
    // path option is the Engine.IO path, not the namespace
    // For Socket.IO, we connect to default namespace "/" with path "/api/socket"
    const socket = io({
      path: socketPath, // Engine.IO path: "/api/socket"
      transports: ["websocket", "polling"], // Support both transports, prefer websocket
      upgrade: true, // Allow upgrade from polling to websocket
      withCredentials: true, // Enable credentials for CORS
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5, // Add randomness to reconnection delay
      timeout: 20000, // Connection timeout (Manager level)
      forceNew: false,
      // Socket.IO v4.6.0+ Retry mechanism
      retries: 2, // Maximum number of retries for packets
      ackTimeout: 5000, // Default timeout for acknowledgements (5 seconds)
      // Socket.IO v4 configuration
      auth: {
        userId: auth.userId,
        role: auth.role ?? undefined,
      } as SocketData,
      // Additional options for better reliability
      autoConnect: true,
      closeOnBeforeunload: false, // Keep connection alive during page navigation
      // Socket.IO v4.6.0+ Connection State Recovery
      // Client sẽ tự động recover missed events khi reconnect
      // Server phải enable connectionStateRecovery để feature này hoạt động
    }) as Socket<ServerToClientEvents, ClientToServerEvents>

    let connectTimeout: NodeJS.Timeout | null = null

    socket.on("connect", () => {
      if (connectTimeout) {
        clearTimeout(connectTimeout)
        connectTimeout = null
      }
      const engine = socket.io.engine
      logger.success("Đã kết nối thành công với WebSocket", {
        action: "socket_connect_success",
        socketId: socket.id,
        transport: engine.transport.name,
        userId: auth.userId,
        role: auth.role,
      })
      this.hasLoggedUnavailable = false
    })

    socket.on("connect_error", (err) => {
      const error = err instanceof Error ? err : new Error(String(err))
      this.logConnectionIssue(error)
    })

    socket.on("disconnect", (reason) => {
      if (connectTimeout) {
        clearTimeout(connectTimeout)
        connectTimeout = null
      }
      logger.info("Đã ngắt kết nối WebSocket", { reason })
    })

    // Timeout để detect nếu connection không thành công
    connectTimeout = setTimeout(() => {
      if (!socket.connected) {
        logger.warn("WebSocket connection timeout", {
          userId: auth.userId,
        })
      }
    }, 20000)

    this.replaceActiveSocket(socket)
    this.attachPendingHandlers(socket)

    return socket
  }

  private replaceActiveSocket(nextSocket: Socket) {
    const previous = this.socket
    if (previous && previous !== nextSocket) {
      // Chỉ disconnect socket cũ nếu nó không đang connecting
      // Nếu đang connecting, đợi nó hoàn thành hoặc fail trước
      const wasConnecting = !previous.connected && this.isConnecting
      
      if (wasConnecting) {
        logger.debug("Socket cũ đang connecting, đợi nó hoàn thành trước khi replace", {
          oldSocketId: previous.id,
          newSocketId: nextSocket.id,
        })
        // Đợi tối đa 2s cho socket cũ connect hoặc fail
        const timeout = setTimeout(() => {
          if (previous && !previous.connected) {
            try {
              previous.removeAllListeners()
              previous.disconnect()
            } catch {
              // Ignore errors khi disconnect
            }
          }
        }, 2000)
        
        // Cleanup timeout nếu socket connect thành công
        previous.once("connect", () => clearTimeout(timeout))
        previous.once("connect_error", () => {
          clearTimeout(timeout)
          try {
            previous.removeAllListeners()
            previous.disconnect()
          } catch {
            // Ignore errors
          }
        })
      } else {
        // Socket cũ đã connected hoặc failed, có thể disconnect ngay
        try {
          logger.info("Disconnecting socket cũ để thay thế bằng socket mới", {
            oldSocketId: previous.id,
            newSocketId: nextSocket.id,
            oldConnected: previous.connected,
          })
          previous.removeAllListeners()
          previous.disconnect()
        } catch (error) {
          logger.warn(
            "Không thể thu hồi socket cũ",
            error instanceof Error ? error : new Error(String(error)),
          )
        }
      }
    }
    this.socket = nextSocket
  }

  private attachPendingHandlers(socket: Socket) {
    for (const [event, handlers] of this.pendingHandlers.entries()) {
      for (const handler of handlers) {
        socket.on(event, handler as Parameters<Socket["on"]>[1])
      }
    }
  }

  private async ensureServerBootstrap(): Promise<boolean> {
    if (this.bootstrapPromise) {
      return this.bootstrapPromise
    }

    this.bootstrapPromise = (async () => {
      while (this.bootstrapRetryCount < this.MAX_BOOTSTRAP_RETRIES) {
        try {
          if (this.bootstrapRetryCount === 0) {
            logger.info("Bắt đầu bootstrap Socket.IO server", {
              action: "bootstrap_start",
            })
          } else {
            logger.info(`Đang thử lại bootstrap Socket.IO server (lần ${this.bootstrapRetryCount}/${this.MAX_BOOTSTRAP_RETRIES})`, {
              action: "bootstrap_retry",
              attempt: this.bootstrapRetryCount,
            })
          }

          const { apiRoutes } = await import("@/constants/api-routes")
          const socketEndpoint = withApiBase(apiRoutes.socket)
          
          logger.debug("Đang gọi socket endpoint để khởi tạo server", {
            endpoint: socketEndpoint,
            path: apiRoutes.socket,
            attempt: this.bootstrapRetryCount + 1,
          })

          const { apiClient } = await import("@/services/api/axios")
          await apiClient.get(apiRoutes.socket)
          
          logger.success("Server đã được khởi tạo thành công", {
            action: "bootstrap_success",
            endpoint: socketEndpoint,
            attempts: this.bootstrapRetryCount + 1,
          })

          // Reset retry count on success
          this.bootstrapRetryCount = 0
          return true
        } catch (error) {
          this.bootstrapRetryCount++
          
          const isLastAttempt = this.bootstrapRetryCount >= this.MAX_BOOTSTRAP_RETRIES
          const err = error instanceof Error ? error : new Error(String(error))
          
          if (isLastAttempt) {
            logger.error("Bootstrap Socket.IO server thất bại sau nhiều lần thử", {
              action: "bootstrap_failed_final",
              error: err.message,
              attempts: this.bootstrapRetryCount,
            })
          } else {
            logger.warn(`Bootstrap attempt ${this.bootstrapRetryCount} failed, retrying...`, {
              action: "bootstrap_retry_failed",
              error: err.message,
              nextAttempt: this.bootstrapRetryCount + 1,
            })
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * this.bootstrapRetryCount))
          }
        }
      }

      // If we reach here, all retries failed
      this.bootstrapPromise = null
      return false
    })()

    return this.bootstrapPromise
  }

  private logConnectionIssue(error: Error) {
    const normalizedMessage = error.message?.toLowerCase?.() ?? ""
    const key = `${error.name}:${normalizedMessage}`
    const now = Date.now()

    // Throttle logging để tránh spam
    if (this.lastConnectionErrorKey === key && now - this.lastConnectionErrorAt < 5000) {
      return
    }

    this.lastConnectionErrorKey = key
    this.lastConnectionErrorAt = now

    const context = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }

    // Log WebSocket errors với mức độ phù hợp
    if (normalizedMessage.includes("invalid namespace")) {
      logger.error("Socket.IO namespace error - kiểm tra path configuration", {
        ...context,
        hint: "Đảm bảo client và server sử dụng cùng path và namespace",
      })
    } else if (normalizedMessage.includes("timeout")) {
      logger.warn("WebSocket connection timeout, sẽ thử lại", context)
    } else if (
      normalizedMessage.includes("websocket") &&
      (normalizedMessage.includes("closed before") ||
       normalizedMessage.includes("transport unknown") ||
       normalizedMessage.includes("connection closed"))
    ) {
      logger.warn("WebSocket connection issue, sẽ tự động reconnect", context)
    } else {
      logger.error("WebSocket connection thất bại", error)
    }
  }
}

const socketManager = new SocketManager()

/**
 * Disconnect socket - chỉ gọi khi đăng xuất
 * Export để có thể gọi từ bất kỳ đâu khi cần disconnect
 */
export const disconnectSocket = (): void => {
  socketManager.disconnect()
}

export const useSocket = ({ userId, role }: UseSocketOptions) => {
  const lastConversationRef = useRef<SocketConversationPair | null>(null)
  const [currentSocket, setCurrentSocket] = useState<Socket | null>(() => socketManager.getSocket())

  useEffect(() => {
    if (!userId) {
      // Khi userId = null, không disconnect socket ngay lập tức
      // Chỉ set state để UI biết, nhưng socket vẫn giữ connection
      // Socket chỉ disconnect khi gọi socketManager.disconnect() (khi đăng xuất)
      const timeoutId = setTimeout(() => {
        setCurrentSocket(null)
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    let cancelled = false

    socketManager
      .connect({ userId, role })
      .then((socket) => {
        if (cancelled) return
        setCurrentSocket(socket ?? null)
      })
      .catch((error) => {
        logger.error(
          "[useSocket] Kết nối Socket.IO thất bại",
          error instanceof Error ? error : new Error(String(error)),
        )
        // Không set null để tránh mất connection, chỉ log error
        // Socket sẽ tự reconnect
      })

    return () => {
      cancelled = true
      // KHÔNG disconnect socket ở đây - chỉ cleanup khi component unmount
      // Socket sẽ tự disconnect khi đăng xuất
    }
  }, [userId, role])

  useEffect(() => {
    const socket = currentSocket
    if (!socket) {
      return
    }

    const handleReconnect = () => {
      const conv = lastConversationRef.current
      if (conv) {
        socket.emit("join-conversation", conv)
      }
    }

    socket.on("connect", handleReconnect)

    return () => {
      socket.off("connect", handleReconnect)
    }
  }, [currentSocket])

  const joinConversation = useCallback((a: string, b: string) => {
    const pair: SocketConversationPair = { a, b }
    lastConversationRef.current = pair
    socketManager.withSocket((socket) => {
      socket.emit("join-conversation", pair)
    })
  }, [])

  const leaveConversation = useCallback((a: string, b: string) => {
    const pair: SocketConversationPair = { a, b }
    socketManager.withSocket((socket) => {
      socket.emit("leave-conversation", pair)
    })
  }, [])

  const sendMessage = useCallback(
    async ({ parentMessageId, content, fromUserId, toUserId }: SocketMessagePayload) => {
      socketManager.withSocket(async (socket) => {
        // Socket.IO v4.6.0+: Promise-based acknowledgements với emitWithAck()
        // Sử dụng timeout() method để set timeout cho acknowledgement (5s)
        // Client sẽ tự động retry dựa trên retries và ackTimeout config
        try {
          const response = await socket
            .timeout(5000) // 5 seconds timeout
            .emitWithAck("message:send", {
              parentMessageId,
              content,
              fromUserId,
              toUserId,
            } satisfies SocketMessagePayload)

          if (response?.error) {
            logger.error("Message send failed", {
              error: response.error,
              fromUserId,
              toUserId,
              contentLength: content.length,
            })
          } else {
            logger.debug("Message send acknowledged", {
              messageId: response?.messageId,
              notificationId: response?.notificationId,
              fromUserId,
              toUserId,
            })
          }
        } catch (error) {
          // Timeout hoặc server không acknowledge trong 5s
          logger.error("Message send error (timeout or no ack received)", {
            error: error instanceof Error ? error.message : String(error),
            fromUserId,
            toUserId,
            contentLength: content.length,
          })
        }
      })
    },
    [],
  )

  const createSocketListener = useCallback(
    <Args extends unknown[]>(event: string, handler: (...args: Args) => void) =>
      socketManager.on(event, handler),
    [],
  )

  const onMessageNew = useCallback(
    (handler: (payload: SocketMessagePayload) => void) =>
      createSocketListener("message:new", handler),
    [createSocketListener],
  )

  const onMessageUpdated = useCallback(
    (handler: (payload: SocketMessagePayload) => void) =>
      createSocketListener("message:updated", handler),
    [createSocketListener],
  )

  const onNotification = useCallback(
    (handler: (payload: SocketNotificationPayload) => void) => {
      const offNew = createSocketListener("notification:new", handler)
      const offAdmin = createSocketListener("notification:admin", handler)
      return () => {
        offNew?.()
        offAdmin?.()
      }
    },
    [createSocketListener],
  )

  const onNotificationsSync = useCallback(
    (handler: (payload: SocketNotificationPayload[]) => void) =>
      createSocketListener("notifications:sync", handler),
    [createSocketListener],
  )

  const onNotificationUpdated = useCallback(
    (handler: (payload: SocketNotificationPayload) => void) =>
      createSocketListener("notification:updated", handler),
    [createSocketListener],
  )

  const markNotificationAsRead = useCallback((notificationId: string) => {
    socketManager.withSocket((socket) => {
      socket.emit("notification:read", { notificationId })
    })
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    socketManager.withSocket((socket) => {
      socket.emit("notifications:mark-all-read")
    })
  }, [])

  const onContactRequestCreated = useCallback(
    (handler: (payload: SocketContactRequestPayload) => void) =>
      createSocketListener("contact-request:new", handler),
    [createSocketListener],
  )

  const onContactRequestAssigned = useCallback(
    (handler: (payload: SocketContactRequestPayload) => void) =>
      createSocketListener("contact-request:assigned", handler),
    [createSocketListener],
  )

  const on = useCallback(
    <Args extends unknown[]>(event: string, handler: (...args: Args) => void) =>
      createSocketListener(event, handler),
    [createSocketListener],
  )

  return {
    socket: currentSocket ?? socketManager.getSocket(),
    joinConversation,
    leaveConversation,
    sendMessage,
    onMessageNew,
    onMessageUpdated,
    onNotification,
    onNotificationsSync,
    onNotificationUpdated,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    onContactRequestCreated,
    onContactRequestAssigned,
    on,
  }
}

