"use client"

import type { CategoryRow } from "../types"
import { queryKeys, type AdminCategoriesListParams } from "@/lib/query-keys"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

interface CategoryUpsertPayload {
  category: CategoryRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface CategoryRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const useCategoriesSocketBridge = () => {
  return useResourceSocketBridge<CategoryRow, AdminCategoriesListParams>({
    resourceName: "categories",
    queryKey: queryKeys.adminCategories.all() as unknown[],
    eventNames: {
      upsert: "category:upsert",
      remove: "category:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as CategoryUpsertPayload
      return p.category
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as CategoryRemovePayload
      return p.id
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
  })
}

