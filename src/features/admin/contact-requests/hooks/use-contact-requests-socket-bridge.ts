"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/use-socket"
import { resourceLogger } from "@/lib/config"
import type { ContactRequestRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminContactRequestsListParams, invalidateQueries } from "@/lib/query-keys"
import type { ContactRequestDetailData } from "../components/contact-request-detail.client"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  convertSocketPayloadToRow,
} from "../utils/socket-helpers"

interface ContactRequestUpsertPayload {
  contactRequest: ContactRequestRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface ContactRequestRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

function updateContactRequestQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (args: { key: unknown[]; params: AdminContactRequestsListParams; data: DataTableResult<ContactRequestRow> }) => DataTableResult<ContactRequestRow> | null,
): boolean {
  let updated = false
  const queries = queryClient.getQueriesData<DataTableResult<ContactRequestRow>>({
    queryKey: queryKeys.adminContactRequests.all() as unknown[],
  })
  
      for (const [key, data] of queries) {
        if (!Array.isArray(key) || key.length < 2) continue
        const params = key[1] as AdminContactRequestsListParams | undefined
        if (!params || !data) continue
        const next = updater({ key, params, data })
        if (next) {
          queryClient.setQueryData(key, next)
          updated = true
        }
      }
  
  return updated
}

export const useContactRequestsSocketBridge = () => {
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

    // Handle contact-request:new event
    const detachNew = on<[{ id: string; name: string; email: string; phone?: string | null; subject: string; status: string; priority: string; createdAt: string; assignedToId?: string | null; assignedToName?: string | null }]>("contact-request:new", (payload) => {

      const row = convertSocketPayloadToRow(payload, payload.assignedToName ?? null)
      const rowStatus: "active" | "deleted" = "active"

      const updated = updateContactRequestQueries(queryClient, ({ params, data }) => {
        const matches = matchesFilters(params.filters, row) && matchesSearch(params.search, row)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((r) => r.id === row.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          return null
        }

        const next: DataTableResult<ContactRequestRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            const updated = [...rows]
            updated[existingIndex] = row
            rows = updated
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

        const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)

        const result = {
          ...next,
          rows,
          total,
          totalPages,
        }


        return result
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
        // Invalidate unread counts để cập nhật contact requests count
        invalidateQueries.unreadCounts(queryClient, session?.user?.id)
      }
    })

    // Handle contact-request:upsert event (for updates)
    const detachUpsert = on<[ContactRequestUpsertPayload]>("contact-request:upsert", (payload) => {
      const { contactRequest, previousStatus, newStatus } = payload as ContactRequestUpsertPayload
      const rowStatus: "active" | "deleted" = contactRequest.deletedAt ? "deleted" : "active"

      resourceLogger.socket({
        resource: "contact-requests",
        action: "socket-update",
        event: "contact-request:upsert",
        resourceId: contactRequest.id,
        payload: { contactRequestId: contactRequest.id, previousStatus, newStatus, rowStatus },
      })

      // Update detail query cache nếu có
      const detailQueryKey = queryKeys.adminContactRequests.detail(contactRequest.id)
      const detailData = queryClient.getQueryData<{ data: ContactRequestDetailData }>(detailQueryKey)
      if (detailData) {
        queryClient.setQueryData(detailQueryKey, {
          data: {
            ...detailData.data,
            ...contactRequest,
            assignedTo: contactRequest.assignedToName
              ? {
                  id: detailData.data.assignedToId || "",
                  name: contactRequest.assignedToName,
                  email: detailData.data.assignedTo?.email || "",
                }
              : null,
            updatedAt: contactRequest.updatedAt,
            deletedAt: contactRequest.deletedAt,
          },
        })
        resourceLogger.socket({
          resource: "contact-requests",
          action: "cache-refresh",
          event: "contact-request:upsert",
          resourceId: contactRequest.id,
          payload: { cacheType: "detail-cache-updated" },
        })
      }

      const updated = updateContactRequestQueries(queryClient, ({ params, data }) => {
        const matches = matchesFilters(params.filters, contactRequest) && matchesSearch(params.search, contactRequest)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((row) => row.id === contactRequest.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          return null
        }

        const next: DataTableResult<ContactRequestRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            const updated = [...rows]
            updated[existingIndex] = contactRequest
            rows = updated
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, contactRequest, next.limit)
            total = total + 1
          } else {
            if (previousStatus && previousStatus !== rowStatus) {
              // Status changed, but on pages > 1 we can't insert accurately
            }
          }
        } else if (existingIndex >= 0) {
          const result = removeRowFromPage(rows, contactRequest.id)
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
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
        // Invalidate unread counts để cập nhật contact requests count
        invalidateQueries.unreadCounts(queryClient, session?.user?.id)
      }
    })

    // Handle contact-request:assigned event
    const detachAssigned = on<[{ id: string; assignedToId?: string | null; assignedToName?: string | null }]>("contact-request:assigned", (payload) => {

      const updated = updateContactRequestQueries(queryClient, ({ data }) => {
        const existingIndex = data.rows.findIndex((r) => r.id === payload.id)
        if (existingIndex === -1) {
          return null
        }

        const next: DataTableResult<ContactRequestRow> = { ...data }
        const rows = [...next.rows]
        rows[existingIndex] = {
          ...rows[existingIndex],
          assignedToName: payload.assignedToName ?? null,
        }

        return {
          ...next,
          rows,
        }
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
        // Invalidate unread counts để cập nhật contact requests count
        invalidateQueries.unreadCounts(queryClient, session?.user?.id)
      }
    })

    // Handle contact-request:remove event
    const detachRemove = on<[ContactRequestRemovePayload]>("contact-request:remove", (payload) => {
      const { id } = payload as ContactRequestRemovePayload
      
      const updated = updateContactRequestQueries(queryClient, ({ params: _params, data }) => {
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
        // Invalidate unread counts để cập nhật contact requests count
        invalidateQueries.unreadCounts(queryClient, session?.user?.id)
      }
    })

    // Batch upsert handler (tối ưu cho bulk operations)
    const detachBatchUpsert = on<[{ contactRequests: ContactRequestRow[]; previousStatus: "active" | "deleted" | null }]>("contact-request:batch-upsert", (payload) => {
      const { contactRequests, previousStatus } = payload as { contactRequests: ContactRequestRow[]; previousStatus: "active" | "deleted" | null }
      
      resourceLogger.socket({
        resource: "contact-requests",
        action: "socket-update",
        event: "contact-request:batch-upsert",
        payload: { count: contactRequests.length, previousStatus },
      })

      let anyUpdated = false
      for (const contactRequest of contactRequests) {
        const rowStatus: "active" | "deleted" = contactRequest.deletedAt ? "deleted" : "active"

        // Update detail query cache nếu có
        const detailQueryKey = queryKeys.adminContactRequests.detail(contactRequest.id)
        const detailData = queryClient.getQueryData<{ data: ContactRequestDetailData }>(detailQueryKey)
        if (detailData) {
          queryClient.setQueryData(detailQueryKey, {
            data: {
              ...detailData.data,
              ...contactRequest,
              assignedTo: contactRequest.assignedToName
                ? {
                    id: detailData.data.assignedToId || "",
                    name: contactRequest.assignedToName,
                    email: detailData.data.assignedTo?.email || "",
                  }
                : null,
              updatedAt: contactRequest.updatedAt,
              deletedAt: contactRequest.deletedAt,
            },
          })
        }

        const updated = updateContactRequestQueries(queryClient, ({ params, data }) => {
          const matches = matchesFilters(params.filters, contactRequest) && matchesSearch(params.search, contactRequest)
          const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
          const existingIndex = data.rows.findIndex((row) => row.id === contactRequest.id)
          const shouldInclude = matches && includesByStatus

          if (existingIndex === -1 && !shouldInclude) {
            return null
          }

          const next: DataTableResult<ContactRequestRow> = { ...data }
          let total = next.total
          let rows = next.rows

          if (shouldInclude) {
            if (existingIndex >= 0) {
              const updated = [...rows]
              updated[existingIndex] = contactRequest
              rows = updated
            } else if (params.page === 1) {
              rows = insertRowIntoPage(rows, contactRequest, next.limit)
              total = total + 1
            }
          } else if (existingIndex >= 0) {
            const result = removeRowFromPage(rows, contactRequest.id)
            rows = result.rows
            if (result.removed) {
              total = Math.max(0, total - 1)
            }
          } else {
            return null
          }

          const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)

          return {
            ...next,
            rows,
            total,
            totalPages,
          }
        })
        if (updated) {
          anyUpdated = true
        }
      }

      if (anyUpdated) {
        setCacheVersion((prev) => prev + 1)
        // Invalidate unread counts để cập nhật contact requests count
        invalidateQueries.unreadCounts(queryClient, session?.user?.id)
      }
    })

    return () => {
      detachNew?.()
      detachUpsert?.()
      detachAssigned?.()
      detachRemove?.()
      detachBatchUpsert?.()
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

