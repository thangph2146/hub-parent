"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"
import { useSocket } from "@/hooks/use-socket"
import type { ProductRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminProductsListParams } from "@/lib/query-keys"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface ProductUpsertPayload {
  product: ProductRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface ProductRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

function updateProductQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (args: { key: unknown[]; params: AdminProductsListParams; data: DataTableResult<ProductRow> }) => DataTableResult<ProductRow> | null,
  _logUpdates = true,
): boolean {
  let updated = false
  const queries = queryClient.getQueriesData<DataTableResult<ProductRow>>({
    queryKey: queryKeys.adminProducts.all() as unknown[],
  })

  for (const [key, data] of queries) {
    if (!Array.isArray(key) || key.length < 2) continue
    const params = key[1] as AdminProductsListParams | undefined
    if (!params || !data) continue
    const next = updater({ key, params, data })
    if (next) {
      queryClient.setQueryData(key, next)
      updated = true
    }
  }

  return updated
}

export function useProductsSocketBridge() {
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

    const detachUpsert = on<[ProductUpsertPayload]>("product:upsert", (payload) => {
      const { product } = payload as ProductUpsertPayload
      const rowStatus: "active" | "deleted" = product.deletedAt ? "deleted" : "active"

      const updated = updateProductQueries(queryClient, ({ params, data }) => {
        const matches = matchesFilters(params.filters, product) && matchesSearch(params.search, product)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((r) => r.id === product.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          return null
        }

        const next: DataTableResult<ProductRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            rows = [...rows]
            rows[existingIndex] = product
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, product, next.limit)
            total = total + 1
          }
        } else if (existingIndex >= 0) {
          const result = removeRowFromPage(rows, product.id)
          rows = result.rows
          if (result.removed) {
            total = Math.max(0, total - 1)
          }
        } else {
          return null
        }

        const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)

        return { ...next, rows, total, totalPages }
      })

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachBatchUpsert = on<[{ products: ProductUpsertPayload[] }]>("product:batch-upsert", (payload) => {
      const { products } = payload as { products: ProductUpsertPayload[] }

      let anyUpdated = false
      for (const { product } of products) {
        const rowStatus: "active" | "deleted" = product.deletedAt ? "deleted" : "active"
        const updated = updateProductQueries(
          queryClient,
          ({ params, data }) => {
            const matches = matchesFilters(params.filters, product) && matchesSearch(params.search, product)
            const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
            const existingIndex = data.rows.findIndex((r) => r.id === product.id)
            const shouldInclude = matches && includesByStatus

            if (existingIndex === -1 && !shouldInclude) {
              return null
            }

            const next: DataTableResult<ProductRow> = { ...data }
            let total = next.total
            let rows = next.rows

            if (shouldInclude) {
              if (existingIndex >= 0) {
                rows = [...rows]
                rows[existingIndex] = product
              } else if (params.page === 1) {
                rows = insertRowIntoPage(rows, product, next.limit)
                total = total + 1
              }
            } else if (existingIndex >= 0) {
              const result = removeRowFromPage(rows, product.id)
              rows = result.rows
              if (result.removed) {
                total = Math.max(0, total - 1)
              }
            } else {
              return null
            }

            const totalPages = total === 0 ? 0 : Math.ceil(total / next.limit)
            return { ...next, rows, total, totalPages }
          },
          false,
        )
        if (updated) anyUpdated = true
      }

      if (anyUpdated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachRemove = on<[ProductRemovePayload]>("product:remove", (payload) => {
      const { id } = payload as ProductRemovePayload

      const updated = updateProductQueries(queryClient, ({ data }) => {
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
      detachBatchUpsert?.()
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

