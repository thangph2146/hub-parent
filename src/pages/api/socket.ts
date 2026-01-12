import type { NextApiRequest, NextApiResponse } from "next"
import { Server as IOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

import { logger } from "@/utils"
import { setupSocketHandlers } from "@/services/socket/server"
import {
  getSocketServer,
  setSocketServer,
  getSocketInitPromise,
  setSocketInitPromise,
} from "@/services/socket/state"
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@/services/socket/types"

type ServerWithIO = HTTPServer & { io?: IOServer }

/**
 * Socket.IO Configuration Constants
 * - maxHttpBufferSize: Maximum size of HTTP request body (5MB)
 * - maxPayload: Maximum size of WebSocket message payload (5MB)
 * - path: Socket.IO endpoint path
 */
const MAX_HTTP_BUFFER_SIZE = 5 * 1024 * 1024 // 5MB
const SOCKET_PATH = "/api/socket"

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // @ts-expect-error - Next.js exposes underlying HTTP server
    const server = res.socket?.server as ServerWithIO | undefined

    if (!server) {
      logger.error("Socket server not available for the current request")
      res.status(500).end("Socket server not available")
      return
    }

    const existingGlobal = getSocketServer()
    if (existingGlobal) {
      if (!server.io) {
        server.io = existingGlobal
      }
      res.end()
      return
    }

    const pendingInit = getSocketInitPromise()
    if (pendingInit) {
      const io = await pendingInit
      if (!server.io) {
        server.io = io
      }
      res.end()
      return
    }

    if (!server.io) {
      logger.info("Initializing Socket.IO server instance", {
        action: "socket_server_init",
        path: SOCKET_PATH,
        maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
        transports: ["websocket", "polling"],
      })
      const initPromise = (async () => {
        const io = new IOServer<
          ClientToServerEvents,
          ServerToClientEvents,
          InterServerEvents,
          SocketData
        >(server, {
          path: SOCKET_PATH,
          cors: { 
            origin: true, 
            credentials: true,
            methods: ["GET", "POST"],
          },
          transports: ["websocket", "polling"], // Support both transports
          allowEIO3: false, // Disable Engine.IO v3 compatibility
          maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
          pingTimeout: 60000, // 60 seconds
          pingInterval: 25000, // 25 seconds
          upgradeTimeout: 10000, // 10 seconds
          // Socket.IO v4.6.0+ Connection State Recovery
          // Cho phép client recover missed events khi reconnect
          connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
            skipMiddlewares: true, // Skip middlewares khi recovery
          },
        })

        // Configure engine options for payload size
        const engineOptions = io.engine.opts as { maxPayload?: number; maxHttpBufferSize: number }
        engineOptions.maxHttpBufferSize = MAX_HTTP_BUFFER_SIZE
        engineOptions.maxPayload = MAX_HTTP_BUFFER_SIZE

        await setupSocketHandlers(io)
        setSocketServer(io)

        logger.success("Socket.IO server initialized successfully", {
          action: "socket_server_ready",
          path: SOCKET_PATH,
          engine: io.engine?.constructor?.name ?? "unknown",
          maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
        })
        return io
      })()

      setSocketInitPromise(initPromise)

      let io: IOServer | undefined
      try {
        io = await initPromise
      } finally {
        setSocketInitPromise(undefined)
      }

      if (!io) {
        throw new Error("Socket.IO server initialization returned undefined instance")
      }

      server.io = io
      res.end()
      return
    }

    const currentSize = server.io.engine.opts.maxHttpBufferSize
    const currentPayload = (server.io.engine.opts as { maxPayload?: number }).maxPayload
    if (currentSize !== MAX_HTTP_BUFFER_SIZE || currentPayload !== MAX_HTTP_BUFFER_SIZE) {
      server.io.engine.opts.maxHttpBufferSize = MAX_HTTP_BUFFER_SIZE
      ;(server.io.engine.opts as { maxPayload?: number }).maxPayload = MAX_HTTP_BUFFER_SIZE
      logger.info("Socket.IO maxHttpBufferSize updated", {
        previousBuffer: currentSize,
        previousPayload: currentPayload ?? null,
        next: MAX_HTTP_BUFFER_SIZE,
      })
    }

    if (!existingGlobal) {
      setSocketServer(server.io)
    }
    logger.debug("Reusing existing Socket.IO server instance")

    res.end()
  } catch (error) {
    logger.error("Socket API route error", error instanceof Error ? error : new Error(String(error)))
    res.status(500).end("Internal Server Error")
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
