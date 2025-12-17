"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { RoleRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminRolesListParams } from "@/lib/query-keys"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useSocketConnection } from "@/features/admin/resources/hooks/use-socket-connection"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface RoleUpsertPayload {
  role: RoleRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface RoleRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const useRolesSocketBridge = () => {
  const queryClient = useQueryClient()
  const { socket, on, isConnected, cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()

  useEffect(() => {
    if (!sessionUserId) return

    const detachUpsert = on<[RoleUpsertPayload]>("role:upsert", (payload) => {
      const { role, previousStatus } = payload as RoleUpsertPayload
      const rowStatus: "active" | "deleted" = role.deletedAt ? "deleted" : "active"

      const updated = updateResourceQueries<RoleRow, AdminRolesListParams>(
        queryClient,
        queryKeys.adminRoles.all() as unknown[],
        ({ params, data }: { params: AdminRolesListParams; data: DataTableResult<RoleRow> }) => {
        const matches = matchesFilters(params.filters, role) && matchesSearch(params.search, role)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((r) => r.id === role.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          // Nothing to update for this page
          return null
        }

        const next: DataTableResult<RoleRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            // Thay thế hoàn toàn với dữ liệu từ server (server là source of truth)
            // Không merge để tránh conflict với optimistic updates
            const updatedRows = [...rows]
            updatedRows[existingIndex] = role
            rows = updatedRows
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, role, next.limit)
            total = total + 1
          } else {
            // On pages > 1 we only adjust total if role previously existed
            if (previousStatus && previousStatus !== rowStatus) {
              // If moved to this status from different view and this page is not 1, we can't insert accurately
              // Leave as is until manual refresh
            }
          }
        } else if (existingIndex >= 0) {
          // Role đang ở trong list nhưng không match với view hiện tại (ví dụ: chuyển từ active sang deleted)
          // Remove khỏi page này
          const result = removeRowFromPage(rows, role.id)
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

        return result
        },
      )

      // Update detail query cache nếu có
      const detailQueryKey = queryKeys.adminRoles.detail(role.id)
      const currentDetailData = queryClient.getQueryData<{ data: RoleRow }>(detailQueryKey)
      if (currentDetailData) {
        queryClient.setQueryData(detailQueryKey, {
          data: role,
        })
      }

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachRemove = on<[RoleRemovePayload]>("role:remove", (payload) => {
      const { id } = payload as RoleRemovePayload

      const updated = updateResourceQueries<RoleRow, AdminRolesListParams>(
        queryClient,
        queryKeys.adminRoles.all() as unknown[],
        ({ data }: { data: DataTableResult<RoleRow> }) => {
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

