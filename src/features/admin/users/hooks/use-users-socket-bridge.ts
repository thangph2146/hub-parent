"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/use-socket"
import { logger } from "@/lib/config"
import type { UserRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminUsersListParams } from "@/lib/query-keys"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface UserUpsertPayload {
  user: UserRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface UserRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

function updateUserQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (args: { key: unknown[]; params: AdminUsersListParams; data: DataTableResult<UserRow> }) => DataTableResult<UserRow> | null,
): boolean {
  let updated = false
  const queries = queryClient.getQueriesData<DataTableResult<UserRow>>({
    queryKey: queryKeys.adminUsers.all() as unknown[],
  })

  logger.debug("Found user queries to update", { count: queries.length })

  for (const [key, data] of queries) {
    if (!Array.isArray(key) || key.length < 2) continue
    const params = key[1] as AdminUsersListParams | undefined
    if (!params || !data) {
      logger.debug("Skipping user query", { hasParams: !!params, hasData: !!data })
      continue
    }
    const next = updater({ key, params, data })
    if (next) {
      logger.debug("Setting user query data", {
        queryKey: key.slice(0, 2),
        oldRowsCount: data.rows.length,
        newRowsCount: next.rows.length,
        oldTotal: data.total,
        newTotal: next.total,
      })
      queryClient.setQueryData(key, next)
      updated = true
    } else {
      logger.debug("User updater returned null, skipping update")
    }
  }

  return updated
}

export function useUsersSocketBridge() {
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

    const detachUpsert = on<[UserUpsertPayload]>("user:upsert", (payload) => {
      const { user, previousStatus, newStatus } = payload as UserUpsertPayload
      const rowStatus: "active" | "deleted" = user.deletedAt ? "deleted" : "active"

      logger.debug("Received user:upsert", {
        userId: user.id,
        previousStatus,
        newStatus,
        rowStatus,
        deletedAt: user.deletedAt,
      })

      const updated = updateUserQueries(queryClient, ({ params, data }) => {
        const matches = matchesFilters(params.filters, user) && matchesSearch(params.search, user)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((r) => r.id === user.id)
        const shouldInclude = matches && includesByStatus

        logger.debug("Processing user update", {
          userId: user.id,
          viewStatus: params.status,
          rowStatus,
          includesByStatus,
          existingIndex,
          shouldInclude,
        })

        if (existingIndex === -1 && !shouldInclude) {
          // Nothing to update for this page
          return null
        }

        const next: DataTableResult<UserRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            // Thay thế hoàn toàn với dữ liệu từ server (server là source of truth)
            // Không merge để tránh conflict với optimistic updates
            const updatedRows = [...rows]
            updatedRows[existingIndex] = user
            rows = updatedRows
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, user, next.limit)
            total = total + 1
          } else {
            // On pages > 1 we only adjust total if user previously existed
            if (previousStatus && previousStatus !== rowStatus) {
              // If moved to this status from different view and this page is not 1, we can't insert accurately
              // Leave as is until manual refresh
            }
          }
        } else if (existingIndex >= 0) {
          // User đang ở trong list nhưng không match với view hiện tại (ví dụ: chuyển từ active sang deleted)
          // Remove khỏi page này
          logger.debug("Removing user from view", {
            userId: user.id,
            viewStatus: params.status,
            rowStatus,
          })
          const result = removeRowFromPage(rows, user.id)
          rows = result.rows
          if (result.removed) {
            total = Math.max(0, total - 1)
          }
        } else {
          return null
        }

        const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)

        // Luôn return object mới để React Query detect được thay đổi
        const result = {
          ...next,
          rows,
          total,
          totalPages,
        }

        logger.debug("Cache updated for user", {
          userId: user.id,
          rowsCount: result.rows.length,
          total: result.total,
          wasRemoved: existingIndex >= 0 && !shouldInclude,
        })

        return result
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachRemove = on<[UserRemovePayload]>("user:remove", (payload) => {
      const { id } = payload as UserRemovePayload
      logger.debug("Received user:remove", { userId: id })

      const updated = updateUserQueries(queryClient, ({ data }) => {
        const result = removeRowFromPage(data.rows, id)
        if (!result.removed) {
          logger.debug("User not found in current view", { userId: id })
          return null
        }

        const total = Math.max(0, data.total - 1)
        const totalPages = total === 0 ? 0 : Math.ceil(total / data.limit)

        logger.debug("Removed user from cache", {
          userId: id,
          oldRowsCount: data.rows.length,
          newRowsCount: result.rows.length,
          oldTotal: data.total,
          newTotal: total,
        })

        return {
          ...data,
          rows: result.rows,
          total,
          totalPages,
        }
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    return () => {
      detachUpsert?.()
      detachRemove?.()
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

