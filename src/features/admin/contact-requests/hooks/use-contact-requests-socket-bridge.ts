"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { resourceLogger } from "@/lib/config/resource-logger"
import type { ContactRequestRow } from "../types"
import { queryKeys, type AdminContactRequestsListParams, invalidateQueries } from "@/lib/query-keys"
import type { ContactRequestDetailData } from "../components/contact-request-detail.client"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { useSocketConnection } from "@/features/admin/resources/hooks/use-socket-connection"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "@/features/admin/resources/utils/socket-helpers"
import { matchesSearch, matchesFilters, convertSocketPayloadToRow } from "../utils/socket-helpers"

const calculateTotalPages = (total: number, limit: number): number => {
  return total === 0 ? 0 : Math.ceil(total / limit)
}

interface ContactRequestUpsertPayload {
  contactRequest: ContactRequestRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface ContactRequestRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

interface ContactRequestNewPayload {
  id: string
  name: string
  email: string
  phone?: string | null
  subject: string
  status: string
  priority: string
  createdAt: string
  assignedToId?: string | null
  assignedToName?: string | null
}

interface ContactRequestBatchUpsertPayload {
  contactRequests: ContactRequestRow[]
  previousStatus: "active" | "deleted" | null
}

// Helper để update detail query cache
const updateContactRequestDetailCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  row: ContactRequestRow
) => {
  const detailQueryKey = queryKeys.adminContactRequests.detail(row.id)
  const detailData = queryClient.getQueryData<{ data: ContactRequestDetailData }>(detailQueryKey)
  if (detailData) {
    queryClient.setQueryData(detailQueryKey, {
      data: {
        ...detailData.data,
        ...row,
        assignedTo: row.assignedToName
          ? {
              id: detailData.data.assignedToId || "",
              name: row.assignedToName,
              email: detailData.data.assignedTo?.email || "",
            }
          : null,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
      },
    })
    resourceLogger.socket({
      resource: "contact-requests",
      action: "cache-refresh",
      event: "contact-request:detail-cache-updated",
      resourceId: row.id,
      payload: { cacheType: "detail-cache-updated" },
    })
  }
}

// Helper để invalidate unread counts
const invalidateUnreadCounts = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined
) => {
  if (userId) {
    invalidateQueries.unreadCounts(queryClient, userId)
  }
}

export const useContactRequestsSocketBridge = () => {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { socket: _socket, on, isConnected: _isConnected, cacheVersion: _cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()

  // Sử dụng generic hook cho các event chuẩn
  const bridge = useResourceSocketBridge<ContactRequestRow, AdminContactRequestsListParams>({
    resourceName: "contact-requests",
    queryKey: queryKeys.adminContactRequests.all() as unknown[],
    eventNames: {
      upsert: "contact-request:upsert",
      batchUpsert: "contact-request:batch-upsert",
      remove: "contact-request:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as ContactRequestUpsertPayload
      return p.contactRequest
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as ContactRequestRemovePayload
      return p.id
    },
    getBatchRowsFromPayload: (payload) => {
      const p = payload as ContactRequestBatchUpsertPayload
      return p.contactRequests
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
    onRowUpserted: (row) => {
      updateContactRequestDetailCache(queryClient, row)
      invalidateUnreadCounts(queryClient, session?.user?.id)
    },
    onRowRemoved: () => {
      invalidateUnreadCounts(queryClient, session?.user?.id)
    },
    onBatchRowsUpserted: (rows) => {
      // Update detail cache cho tất cả rows trong batch
      rows.forEach((row) => {
        updateContactRequestDetailCache(queryClient, row)
      })
      invalidateUnreadCounts(queryClient, session?.user?.id)
    },
  })

  useEffect(() => {
    if (!sessionUserId) return

    // Handle contact-request:new event (custom event - tương tự upsert nhưng payload khác)
    const detachNew = on<[ContactRequestNewPayload]>("contact-request:new", (payload) => {
      const row = convertSocketPayloadToRow(payload, payload.assignedToName ?? null)
      const rowStatus: "active" | "deleted" = "active"

      const updated = updateResourceQueries<ContactRequestRow, AdminContactRequestsListParams>(
        queryClient,
        queryKeys.adminContactRequests.all() as unknown[],
        ({ params, data }) => {
          const matches = matchesFilters(params.filters, row) && matchesSearch(params.search, row)
          const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
          const existingIndex = data.rows.findIndex((r) => r.id === row.id)
          const shouldInclude = matches && includesByStatus

          if (existingIndex === -1 && !shouldInclude) {
            return null
          }

          const next = { ...data }
          let total = next.total
          let rows = next.rows

          if (shouldInclude) {
            if (existingIndex >= 0) {
              rows = [...rows]
              rows[existingIndex] = row
            } else if (params.page === 1) {
              rows = insertRowIntoPage(rows, row, next.limit)
              total = total + 1
            }
          } else if (existingIndex >= 0) {
            const result = removeRowFromPage(rows, row.id)
            rows = result.rows
            if (result.removed) {
              total = Math.max(0, total - 1)
            }
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
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
        invalidateUnreadCounts(queryClient, session?.user?.id)
      }
    })


    // Handle contact-request:assigned event (custom event - chỉ update assignedToName)
    const detachAssigned = on<[{ id: string; assignedToId?: string | null; assignedToName?: string | null }]>("contact-request:assigned", (payload) => {
      const updated = updateResourceQueries<ContactRequestRow, AdminContactRequestsListParams>(
        queryClient,
        queryKeys.adminContactRequests.all() as unknown[],
        ({ data }) => {
          const existingIndex = data.rows.findIndex((r) => r.id === payload.id)
          if (existingIndex === -1) {
            return null
          }

          const next = { ...data }
          const rows = [...next.rows]
          rows[existingIndex] = {
            ...rows[existingIndex],
            assignedToName: payload.assignedToName ?? null,
          }

          return {
            ...next,
            rows,
          }
        }
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
        invalidateUnreadCounts(queryClient, session?.user?.id)
      }
    })

    return () => {
      detachNew?.()
      detachAssigned?.()
    }
  }, [sessionUserId, on, queryClient, setCacheVersion, session?.user?.id])

  return { socket: bridge.socket, isSocketConnected: bridge.isSocketConnected, cacheVersion: bridge.cacheVersion }
}

