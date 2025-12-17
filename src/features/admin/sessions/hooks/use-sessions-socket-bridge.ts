"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { SessionRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminSessionsListParams } from "@/lib/query-keys"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useSocketConnection } from "@/features/admin/resources/hooks/use-socket-connection"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface SessionUpsertPayload {
  session: SessionRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface SessionRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const useSessionsSocketBridge = () => {
  const queryClient = useQueryClient()
  const { socket, on, isConnected, cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()

  useEffect(() => {
    if (!sessionUserId) return

    // Handle session:upsert event (for updates, creates, restores)
    const detachUpsert = on<[SessionUpsertPayload]>("session:upsert", (payload) => {
      const { session: sessionRow, previousStatus } = payload as SessionUpsertPayload
      const rowStatus: "active" | "deleted" = sessionRow.isActive ? "active" : "deleted"

      const updated = updateResourceQueries<SessionRow, AdminSessionsListParams>(
        queryClient,
        queryKeys.adminSessions.all() as unknown[],
        ({ params, data }: { params: AdminSessionsListParams; data: DataTableResult<SessionRow> }) => {
        const matches = matchesFilters(params.filters, sessionRow) && matchesSearch(params.search, sessionRow)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((row) => row.id === sessionRow.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          return null
        }

        const next: DataTableResult<SessionRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            const updatedRows = [...rows]
            updatedRows[existingIndex] = sessionRow
            rows = updatedRows
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, sessionRow, next.limit)
            total = total + 1
          } else {
            if (previousStatus && previousStatus !== rowStatus) {
            }
          }
        } else if (existingIndex >= 0) {
          // Session đang ở trong list nhưng không match với view hiện tại (ví dụ: chuyển từ active sang deleted)
          // Remove khỏi page này
          const result = removeRowFromPage(rows, sessionRow.id)
          rows = result.rows
          if (result.removed) {
            total = Math.max(0, total - 1)
          }
        } else {
          return null
        }

        const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)

        const result = {
          ...next,
          rows,
          total,
          totalPages,
        }

        return result
        },
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    // Handle session:remove event (for hard deletes)
    const detachRemove = on<[SessionRemovePayload]>("session:remove", (payload) => {
      const { id } = payload as SessionRemovePayload

      const updated = updateResourceQueries<SessionRow, AdminSessionsListParams>(
        queryClient,
        queryKeys.adminSessions.all() as unknown[],
        ({ data }: { data: DataTableResult<SessionRow> }) => {
        const result = removeRowFromPage(data.rows, id)
        if (!result.removed) {
          return null
        }

        const total = Math.max(0, data.total - 1)
        const totalPages = total === 0 ? 0 : Math.ceil(total / data.limit)

        return {
          ...data,
          rows: result.rows,
          total,
          totalPages,
        }
        },
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    return () => {
      detachUpsert?.()
      detachRemove?.()
    }
  }, [sessionUserId, on, queryClient, setCacheVersion])

  return { socket, isSocketConnected: isConnected, cacheVersion }
}

