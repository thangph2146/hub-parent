"use client"

import { useEffect, useRef, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { DataTableResult } from "@/components/tables"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useSocketConnection } from "./use-socket-connection"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "@/features/admin/resources/utils/socket-helpers"

export interface ResourceSocketBridgeConfig<
  TRow extends { id: string },
  _TParams = Record<string, unknown>
> {
  resourceName: string
  queryKey: unknown[]
  eventNames: {
    upsert: string
    batchUpsert?: string
    remove: string
    batchRemove?: string
  }
  getRowFromPayload: (payload: unknown) => TRow
  getRowIdFromPayload?: (payload: unknown) => string
  getBatchRowsFromPayload?: (payload: unknown) => TRow[]
  getBatchIdsFromPayload?: (payload: unknown) => string[]
  getRowStatus: (row: TRow) => "active" | "deleted"
  matchesSearch: (search: string | undefined, row: TRow) => boolean
  matchesFilters: (filters: Record<string, string> | undefined, row: TRow) => boolean
  debounceMs?: number
  onRowUpserted?: (row: TRow) => void
  onRowRemoved?: (id: string) => void
  onBatchRowsUpserted?: (rows: TRow[]) => void
  onQueryUpdated?: (args: { key: unknown[]; oldData: DataTableResult<TRow>; newData: DataTableResult<TRow> }) => void
}

const calculateTotalPages = (total: number, limit: number): number => {
  return total === 0 ? 0 : Math.ceil(total / limit)
}

const createUpsertUpdater = <TRow extends { id: string }, TParams extends { status?: "active" | "deleted" | "all"; page?: number; filters?: Record<string, string>; search?: string }>(
  row: TRow,
  getRowStatus: (row: TRow) => "active" | "deleted",
  matchesSearch: (search: string | undefined, row: TRow) => boolean,
  matchesFilters: (filters: Record<string, string> | undefined, row: TRow) => boolean,
) => {
  return ({ params, data }: { params: TParams; data: DataTableResult<TRow> }): DataTableResult<TRow> | null => {
    // Kiểm tra data và data.rows tồn tại
    if (!data || !data.rows || !Array.isArray(data.rows)) {
      return null
    }

    const rowStatus = getRowStatus(row)
    const matches = matchesFilters(params.filters, row) && matchesSearch(params.search, row)
    const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
    const existingIndex = data.rows.findIndex((r) => r.id === row.id)
    const shouldInclude = matches && includesByStatus

    if (existingIndex === -1 && !shouldInclude) {
      return null
    }

    const next: DataTableResult<TRow> = { ...data }
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
}

const _createRemoveUpdater = <TRow extends { id: string }>() => {
  return ({ data: _data }: { data: DataTableResult<TRow> }): DataTableResult<TRow> | null => {
    // This will be called with id separately
    return null
  }
}

export const useResourceSocketBridge = <
  TRow extends { id: string },
  TParams extends { status?: "active" | "deleted" | "all"; page?: number; filters?: Record<string, string>; search?: string } = Record<string, unknown>
>(
  config: ResourceSocketBridgeConfig<TRow, TParams>
) => {
  const queryClient = useQueryClient()
  const { socket, on, isConnected, cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()
  const cacheVersionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceMs = config.debounceMs ?? 0

  const updateCacheVersion = useCallback(() => {
    if (debounceMs > 0) {
      if (cacheVersionTimeoutRef.current) {
        clearTimeout(cacheVersionTimeoutRef.current)
      }
      cacheVersionTimeoutRef.current = setTimeout(() => {
        setCacheVersion((prev) => prev + 1)
        cacheVersionTimeoutRef.current = null
      }, debounceMs)
    } else {
      setCacheVersion((prev) => prev + 1)
    }
  }, [setCacheVersion, debounceMs])

  useEffect(() => {
    if (!sessionUserId) return

    // Single upsert handler
    const detachUpsert = on<[unknown]>(config.eventNames.upsert, (payload) => {
      const row = config.getRowFromPayload(payload)
      const updater = createUpsertUpdater<TRow, TParams>(
        row,
        config.getRowStatus,
        config.matchesSearch,
        config.matchesFilters
      )

      // Track updates for logging
      const queryUpdates: Array<{ key: unknown[]; oldData: DataTableResult<TRow>; newData: DataTableResult<TRow> }> = []

      const updated = updateResourceQueries<TRow, TParams>(
        queryClient,
        config.queryKey,
        (args) => {
          const result = updater(args)
          // Track update for logging
          if (result && config.onQueryUpdated) {
            queryUpdates.push({
              key: args.key,
              oldData: args.data,
              newData: result,
            })
          }
          return result
        }
      )

      // Call logging callback for each updated query
      if (config.onQueryUpdated) {
        queryUpdates.forEach((update) => {
          config.onQueryUpdated!(update)
        })
      }

      if (updated) {
        updateCacheVersion()
      }

      // Call custom callback if provided
      if (config.onRowUpserted) {
        config.onRowUpserted(row)
      }
    })

    // Batch upsert handler
    let detachBatchUpsert: (() => void) | undefined
    if (config.eventNames.batchUpsert && config.getBatchRowsFromPayload) {
      detachBatchUpsert = on<[unknown]>(config.eventNames.batchUpsert, (payload) => {
        const rows = config.getBatchRowsFromPayload!(payload)
        let anyUpdated = false

        for (const row of rows) {
          const updater = createUpsertUpdater<TRow, TParams>(
            row,
            config.getRowStatus,
            config.matchesSearch,
            config.matchesFilters
          )

          const updated = updateResourceQueries<TRow, TParams>(
            queryClient,
            config.queryKey,
            updater
          )

          if (updated) anyUpdated = true
        }

        if (anyUpdated) {
          updateCacheVersion()
        }

        // Call batch callback if provided
        if (config.onBatchRowsUpserted) {
          config.onBatchRowsUpserted(rows)
        }
      })
    }

    // Single remove handler
    const detachRemove = on<[unknown]>(config.eventNames.remove, (payload) => {
      const id = config.getRowIdFromPayload
        ? config.getRowIdFromPayload(payload)
        : (payload as { id: string }).id

      if (!id) return

      const updated = updateResourceQueries<TRow, TParams>(
        queryClient,
        config.queryKey,
        ({ data }: { data: DataTableResult<TRow> }) => {
          // Kiểm tra data và data.rows tồn tại
          if (!data || !data.rows || !Array.isArray(data.rows)) {
            return null
          }

          const result = removeRowFromPage(data.rows, id)
          if (!result.removed) {
            return null
          }

          const total = Math.max(0, data.total - 1)
          const totalPages = calculateTotalPages(total, data.limit)

          return {
            ...data,
            rows: result.rows,
            total,
            totalPages,
          }
        }
      )

      if (updated) {
        updateCacheVersion()
      }

      // Call custom callback if provided
      if (config.onRowRemoved) {
        config.onRowRemoved(id)
      }
    })

    // Batch remove handler
    let detachBatchRemove: (() => void) | undefined
    if (config.eventNames.batchRemove && config.getBatchIdsFromPayload) {
      detachBatchRemove = on<[unknown]>(config.eventNames.batchRemove, (payload) => {
        const ids = config.getBatchIdsFromPayload!(payload)
        let anyUpdated = false

        for (const id of ids) {
          if (!id) continue

          const updated = updateResourceQueries<TRow, TParams>(
            queryClient,
            config.queryKey,
            ({ data }: { data: DataTableResult<TRow> }) => {
              // Kiểm tra data và data.rows tồn tại
              if (!data || !data.rows || !Array.isArray(data.rows)) {
                return null
              }

              const result = removeRowFromPage(data.rows, id)
              if (!result.removed) {
                return null
              }

              const total = Math.max(0, data.total - 1)
              const totalPages = calculateTotalPages(total, data.limit)

              return {
                ...data,
                rows: result.rows,
                total,
                totalPages,
              }
            }
          )

          if (updated) anyUpdated = true
        }

        if (anyUpdated) {
          updateCacheVersion()
        }
      })
    }

    return () => {
      detachUpsert?.()
      detachBatchUpsert?.()
      detachRemove?.()
      detachBatchRemove?.()
      if (cacheVersionTimeoutRef.current) {
        clearTimeout(cacheVersionTimeoutRef.current)
      }
    }
  }, [
    sessionUserId,
    on,
    queryClient,
    updateCacheVersion,
    config,
  ])

  return {
    socket,
    isSocketConnected: isConnected,
    cacheVersion,
  }
}

