"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks"
import { logger } from "@/utils"
import type { NotificationRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys } from "@/constants"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import {
  insertRowIntoPage,
  removeRowFromPage,
} from "@/features/admin/resources/utils/socket-helpers"
import { convertSocketPayloadToRow } from "../utils/socket-helpers"
import { deduplicateById } from "@/utils"

const calculateTotalPages = (total: number, limit: number): number => {
  return total === 0 ? 0 : Math.ceil(total / limit)
}

interface NotificationUpsertPayload {
  id: string
  kind: string
  title: string
  description?: string | null
  read?: boolean
  toUserId: string
  timestamp?: number
  userEmail?: string | null
  userName?: string | null
}

interface NotificationRemovePayload {
  id: string
}

type NotificationsDeletedSocketPayload =
  | NotificationRemovePayload[]
  | { ids?: string[] | null | undefined }
  | string[]
  | null
  | undefined

const normalizeNotificationsDeletedPayload = (payload: NotificationsDeletedSocketPayload): string[] => {
  if (!payload) return []

  if (Array.isArray(payload)) {
    if (payload.length === 0) return []

    if (typeof payload[0] === "string") {
      return (payload as string[]).filter((id): id is string => typeof id === "string" && id.length > 0)
    }

    return (payload as NotificationRemovePayload[])
      .map((item) => item?.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  }

  if (Array.isArray(payload.ids)) {
    return payload.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
  }

  return []
}

// Helper để tạo updater cho notification upsert
const createNotificationUpsertUpdater = (row: NotificationRow) => {
  return ({ data }: { data: DataTableResult<NotificationRow> }) => {
    if (!data || !Array.isArray(data.rows)) {
      logger.debug("Skipping update - invalid data structure", {
        hasData: !!data,
        hasRows: !!data?.rows,
        isArray: Array.isArray(data?.rows),
      })
      return null
    }

    const existingIndex = data.rows.findIndex((r) => r.id === row.id)
    const next = { ...data }
    let total = next.total
    let rows = next.rows

    if (existingIndex >= 0) {
      rows = [...rows]
      rows[existingIndex] = row
    } else if (data.page === 1) {
      rows = insertRowIntoPage(rows, row, next.limit)
      total = total + 1
    } else {
      return null
    }

    return {
      ...next,
      rows,
      total,
      totalPages: calculateTotalPages(total, next.limit),
    }
  }
}

export const useNotificationsSocketBridge = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const primaryRole = useMemo(() => session?.roles?.[0]?.name ?? null, [session?.roles])
  const [cacheVersion, setCacheVersion] = useState(0)

  const { socket, on } = useSocket({
    userId: session?.user?.id,
    role: primaryRole,
  })

  const [isConnected, setIsConnected] = useState<boolean>(() => Boolean(socket?.connected))

  useEffect(() => {
    if (!session?.user?.id) return

    // Helper để xử lý notification upsert events (new, updated, admin)
    const handleNotificationUpsert = (payload: NotificationUpsertPayload, eventName: string) => {
      logger.debug(`Received ${eventName}`, {
        notificationId: payload.id,
        toUserId: payload.toUserId,
      })

      const row = convertSocketPayloadToRow(payload, payload.userEmail, payload.userName)
      const updated = updateResourceQueries<NotificationRow, Record<string, never>>(
        queryClient,
        queryKeys.notifications.admin() as unknown[],
        createNotificationUpsertUpdater(row)
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    }

    const detachUpsert = on<[NotificationUpsertPayload]>("notification:new", (payload) => {
      handleNotificationUpsert(payload, "notification:new")
    })

    const detachUpdated = on<[NotificationUpsertPayload]>("notification:updated", (payload) => {
      handleNotificationUpsert(payload, "notification:updated")
    })

    const detachAdmin = on<[NotificationUpsertPayload]>("notification:admin", (payload) => {
      handleNotificationUpsert(payload, "notification:admin")
    })

    const detachRemove = on<[NotificationRemovePayload]>("notification:deleted", (payload) => {
      const { id } = payload as NotificationRemovePayload
      logger.debug("Received notification:deleted", { notificationId: id })
      
      const updated = updateResourceQueries<NotificationRow, Record<string, never>>(
        queryClient,
        queryKeys.notifications.admin() as unknown[],
        ({ data }) => {
          if (!data || !Array.isArray(data.rows)) {
            return null
          }
          
          const result = removeRowFromPage(data.rows, id)
          if (!result.removed) {
            logger.debug("Notification not found in current view", { notificationId: id })
            return null
          }
          
          const total = Math.max(0, data.total - 1)
          return {
            ...data,
            rows: result.rows,
            total,
            totalPages: calculateTotalPages(total, data.limit),
          }
        }
      )
      
      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachBulkRemove = on<[NotificationsDeletedSocketPayload]>("notifications:deleted", (payload) => {
      const ids = normalizeNotificationsDeletedPayload(payload)
      if (ids.length === 0) {
        logger.warn("Received notifications:deleted without valid payload")
        return
      }

      logger.debug("Received notifications:deleted", { count: ids.length })
      
      const updated = updateResourceQueries<NotificationRow, Record<string, never>>(
        queryClient,
        queryKeys.notifications.admin() as unknown[],
        ({ data }) => {
          if (!data || !Array.isArray(data.rows)) {
            return null
          }
          
          let rows = data.rows
          let removedCount = 0

          for (const id of ids) {
            const result = removeRowFromPage(rows, id)
            if (result.removed) {
              rows = result.rows
              removedCount++
            }
          }

          if (removedCount === 0) {
            return null
          }
          
          const total = Math.max(0, data.total - removedCount)
          return {
            ...data,
            rows,
            total,
            totalPages: calculateTotalPages(total, data.limit),
          }
        }
      )
      
      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachSync = on<[NotificationUpsertPayload[]]>("notifications:sync", (payloads) => {
      const updated = updateResourceQueries<NotificationRow, Record<string, never>>(
        queryClient,
        queryKeys.notifications.admin() as unknown[],
        ({ data }) => {
          if (!data || !Array.isArray(data.rows)) {
            logger.debug("Skipping sync - invalid data structure", {
              hasData: !!data,
              hasRows: !!data?.rows,
              isArray: Array.isArray(data?.rows),
            })
            return null
          }

          // Convert payloads to rows
          const incomingRows = payloads
            .map((p) => convertSocketPayloadToRow(p, p.userEmail, p.userName))
          
          if (incomingRows.length === 0) {
            return null
          }

          // Nếu payload có số lượng lớn (ví dụ >= 10 hoặc >= limit), 
          // có khả năng đây là full sync cho page 1
          const isLikelyFullSync = incomingRows.length >= (data.limit || 10)

          let nextRows: NotificationRow[]
          let nextTotal = data.total

          if (isLikelyFullSync && data.page === 1) {
            // Full sync cho page 1
            nextRows = deduplicateById(incomingRows)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, data.limit)
            // Nếu là full sync, total có thể được update nếu payload tin cậy, 
            // nhưng ở đây ta chỉ update dựa trên số lượng nhận được nếu nó lớn hơn total hiện tại
            nextTotal = Math.max(data.total, incomingRows.length)
          } else {
            // Partial sync - merge vào rows hiện tại
            const rowsMap = new Map(data.rows.map(r => [r.id, r]))
            let addedCount = 0
            
            incomingRows.forEach(row => {
              if (!rowsMap.has(row.id)) {
                addedCount++
              }
              rowsMap.set(row.id, row)
            })

            nextRows = Array.from(rowsMap.values())
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, data.limit)
            
            nextTotal = data.total + addedCount
          }

          logger.debug("Synced notifications in cache (merged)", {
            incomingCount: incomingRows.length,
            rowsCount: nextRows.length,
            total: nextTotal,
            isFullSync: isLikelyFullSync && data.page === 1
          })

          return {
            ...data,
            rows: nextRows,
            total: nextTotal,
            totalPages: calculateTotalPages(nextTotal, data.limit),
          }
        }
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    return () => {
      detachUpsert?.()
      detachUpdated?.()
      detachAdmin?.()
      detachRemove?.()
      detachBulkRemove?.()
      detachSync?.()
    }
  }, [session?.user?.id, on, queryClient])

  useEffect(() => {
    if (!socket) {
      return
    }

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
    }
  }, [socket])

  return { socket, isSocketConnected: isConnected, cacheVersion }
}

