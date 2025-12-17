"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { PostRow } from "../types"
import type { DataTableResult } from "@/components/tables"
import { queryKeys, type AdminPostsListParams } from "@/lib/query-keys"
import { updateResourceQueries } from "@/features/admin/resources/utils/update-resource-queries"
import { useSocketConnection } from "@/features/admin/resources/hooks/use-socket-connection"
import {
  matchesSearch,
  matchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "../utils/socket-helpers"

interface PostUpsertPayload {
  post: PostRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface PostRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const usePostsSocketBridge = () => {
  const queryClient = useQueryClient()
  const { socket, on, isConnected, cacheVersion, setCacheVersion, sessionUserId } = useSocketConnection()

  useEffect(() => {
    if (!sessionUserId) return

    const detachUpsert = on<[PostUpsertPayload]>("post:upsert", (payload) => {
      const { post } = payload as PostUpsertPayload
      const rowStatus: "active" | "deleted" = post.deletedAt ? "deleted" : "active"

      const updated = updateResourceQueries<PostRow, AdminPostsListParams>(
        queryClient,
        queryKeys.adminPosts.all() as unknown[],
        ({ params, data }: { params: AdminPostsListParams; data: DataTableResult<PostRow> }) => {
        const matches = matchesFilters(params.filters, post) && matchesSearch(params.search, post)
        const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
        const existingIndex = data.rows.findIndex((r) => r.id === post.id)
        const shouldInclude = matches && includesByStatus

        if (existingIndex === -1 && !shouldInclude) {
          return null
        }

        const next: DataTableResult<PostRow> = { ...data }
        let total = next.total
        let rows = next.rows

        if (shouldInclude) {
          if (existingIndex >= 0) {
            rows = [...rows]
            rows[existingIndex] = post
          } else if (params.page === 1) {
            rows = insertRowIntoPage(rows, post, next.limit)
            total = total + 1
          }
        } else if (existingIndex >= 0) {
          const result = removeRowFromPage(rows, post.id)
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
      )

      if (updated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    // Batch upsert handler (tối ưu cho bulk operations)
    const detachBatchUpsert = on<[{ posts: PostUpsertPayload[] }]>("post:batch-upsert", (payload) => {
      const { posts } = payload as { posts: PostUpsertPayload[] }

      let anyUpdated = false
      for (const { post } of posts) {
        const rowStatus: "active" | "deleted" = post.deletedAt ? "deleted" : "active"
        const updated = updateResourceQueries<PostRow, AdminPostsListParams>(
          queryClient,
          queryKeys.adminPosts.all() as unknown[],
          ({ params, data }: { params: AdminPostsListParams; data: DataTableResult<PostRow> }) => {
            const matches = matchesFilters(params.filters, post) && matchesSearch(params.search, post)
            const includesByStatus = shouldIncludeInStatus(params.status, rowStatus)
            const existingIndex = data.rows.findIndex((r) => r.id === post.id)
            const shouldInclude = matches && includesByStatus

            if (existingIndex === -1 && !shouldInclude) {
              return null
            }

            const next: DataTableResult<PostRow> = { ...data }
            let total = next.total
            let rows = next.rows

            if (shouldInclude) {
              if (existingIndex >= 0) {
                rows = [...rows]
                rows[existingIndex] = post
              } else if (params.page === 1) {
                rows = insertRowIntoPage(rows, post, next.limit)
                total = total + 1
              }
            } else if (existingIndex >= 0) {
              const result = removeRowFromPage(rows, post.id)
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
        )
        if (updated) anyUpdated = true
      }

      if (anyUpdated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    const detachRemove = on<[PostRemovePayload]>("post:remove", (payload) => {
      const { id } = payload as PostRemovePayload

      const updated = updateResourceQueries<PostRow, AdminPostsListParams>(
        queryClient,
        queryKeys.adminPosts.all() as unknown[],
        ({ data }: { data: DataTableResult<PostRow> }) => {
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

    // Batch remove handler (tối ưu cho bulk operations)
    const detachBatchRemove = on<[{ posts: PostRemovePayload[] }]>("post:batch-remove", (payload) => {
      const { posts } = payload as { posts: PostRemovePayload[] }

      let anyUpdated = false
      for (const { id } of posts) {
        const updated = updateResourceQueries<PostRow, AdminPostsListParams>(
          queryClient,
          queryKeys.adminPosts.all() as unknown[],
          ({ data }: { data: DataTableResult<PostRow> }) => {
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
        if (updated) anyUpdated = true
      }

      if (anyUpdated) {
        setCacheVersion((prev) => prev + 1)
      }
    })

    return () => {
      detachUpsert?.()
      detachBatchUpsert?.()
      detachRemove?.()
      detachBatchRemove?.()
    }
  }, [sessionUserId, on, queryClient, setCacheVersion])

  return { socket, isSocketConnected: isConnected, cacheVersion }
}

