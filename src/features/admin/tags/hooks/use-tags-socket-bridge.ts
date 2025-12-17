"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { TagRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminTagsListParams } from "@/lib/query-keys"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useSocketConnection } from "@/features/admin/resources/hooks/use-socket-connection"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface TagUpsertPayload {
  tag: TagRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface TagRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const useTagsSocketBridge = () => {
  const queryClient = useQueryClient()
  const { socket, on, isConnected, cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()

  useEffect(() => {
    if (!sessionUserId) return

    const detachUpsert = on<[TagUpsertPayload]>("tag:upsert", (payload) => {
      const { tag, previousStatus } = payload as TagUpsertPayload
      const rowStatus: "active" | "deleted" = tag.deletedAt ? "deleted" : "active"

      // Không log chi tiết từng tag để tránh duplicate logs trong bulk operations
      // Chỉ log tổng hợp nếu cần debug

      const updated = updateResourceQueries<TagRow, AdminTagsListParams>(
        queryClient,
        queryKeys.adminTags.all() as unknown[],
        ({ params, data }: { params: AdminTagsListParams; data: DataTableResult<TagRow> }) => {
        const matches = matchesFilters(params.filters, tag) && matchesSearch(params.search, tag)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((r) => r.id === tag.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          // Nothing to update for this page
          return null
        }

        const next: DataTableResult<TagRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            // Thay thế hoàn toàn với dữ liệu từ server (server là source of truth)
            // Không merge để tránh conflict với optimistic updates
            const updatedRows = [...rows]
            updatedRows[existingIndex] = tag
            rows = updatedRows
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, tag, next.limit)
            total = total + 1
          } else {
            // On pages > 1 we only adjust total if tag previously existed
            if (previousStatus && previousStatus !== rowStatus) {
              // If moved to this status from different view and this page is not 1, we can't insert accurately
              // Leave as is until manual refresh
            }
          }
        } else if (existingIndex >= 0) {
          // Tag đang ở trong list nhưng không match với view hiện tại (ví dụ: chuyển từ active sang deleted)
          // Remove khỏi page này
          const result = removeRowFromPage(rows, tag.id)
          rows = result.rows
          if (result.removed) {
            total = Math.max(0, total - 1)
          }
        } else {
          return null
        }

        const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)

        // Luôn return object mới để React Query detect được thay đổi
        return {
          ...next,
          rows,
          total,
          totalPages,
        }
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachRemove = on<[TagRemovePayload]>("tag:remove", (payload) => {
      const { id } = payload as TagRemovePayload
      // Không log chi tiết để tránh duplicate logs

      const updated = updateResourceQueries<TagRow, AdminTagsListParams>(
        queryClient,
        queryKeys.adminTags.all() as unknown[],
        ({ data }: { data: DataTableResult<TagRow> }) => {
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
      })

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

