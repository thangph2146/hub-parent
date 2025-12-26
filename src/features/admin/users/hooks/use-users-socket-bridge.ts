"use client"

import type { UserRow } from "../types"
import { queryKeys, type AdminUsersListParams } from "@/lib/query-keys"
import { resourceLogger } from "@/lib/config"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

interface UserUpsertPayload {
  user: UserRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface UserRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const useUsersSocketBridge = () => {
  return useResourceSocketBridge<UserRow, AdminUsersListParams>({
    resourceName: "users",
    queryKey: queryKeys.adminUsers.all() as unknown[],
    eventNames: {
      upsert: "user:upsert",
      batchUpsert: "user:batch-upsert",
      remove: "user:remove",
      batchRemove: "user:batch-remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as UserUpsertPayload
      return p.user
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as UserRemovePayload
      return p.id
    },
    getBatchRowsFromPayload: (payload) => {
      const p = payload as { users: UserUpsertPayload[] }
      return p.users.map((item) => item.user)
    },
    getBatchIdsFromPayload: (payload) => {
      const p = payload as { users: UserRemovePayload[] }
      return p.users.map((item) => item.id)
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
    debounceMs: 150,
    onQueryUpdated: ({ key, oldData, newData }) => {
      // Custom logging cho users
      resourceLogger.socket({
        resource: "users",
        event: "user:query-updated",
        action: "socket-update",
        payload: {
          queryKey: key.slice(0, 2),
          oldRowsCount: oldData.rows.length,
          newRowsCount: newData.rows.length,
          oldTotal: oldData.total,
          newTotal: newData.total,
        },
      })
    },
  })
}

