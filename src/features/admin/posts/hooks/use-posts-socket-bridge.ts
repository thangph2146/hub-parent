"use client"

import type { PostRow } from "../types"
import { queryKeys, type AdminPostsListParams } from "@/lib/query-keys"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

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
  return useResourceSocketBridge<PostRow, AdminPostsListParams>({
    resourceName: "posts",
    queryKey: queryKeys.adminPosts.all() as unknown[],
    eventNames: {
      upsert: "post:upsert",
      batchUpsert: "post:batch-upsert",
      remove: "post:remove",
      batchRemove: "post:batch-remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as PostUpsertPayload
      return p.post
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as PostRemovePayload
      return p.id
    },
    getBatchRowsFromPayload: (payload) => {
      const p = payload as { posts: PostUpsertPayload[] }
      return p.posts.map((item) => item.post)
    },
    getBatchIdsFromPayload: (payload) => {
      const p = payload as { posts: PostRemovePayload[] }
      return p.posts.map((item) => item.id)
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
  })
}

