"use client"

import type { TagRow } from "../types"
import { queryKeys, type AdminTagsListParams } from "@/constants"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

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
  return useResourceSocketBridge<TagRow, AdminTagsListParams>({
    resourceName: "tags",
    queryKey: queryKeys.adminTags.all() as unknown[],
    eventNames: {
      upsert: "tag:upsert",
      remove: "tag:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as TagUpsertPayload
      return p.tag
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as TagRemovePayload
      return p.id
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
  })
}

