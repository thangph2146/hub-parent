"use client"

import { useQueryClient } from "@tanstack/react-query"
import type { RoleRow } from "../types"
import { queryKeys, type AdminRolesListParams } from "@/lib/query-keys"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

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
  
  const bridge = useResourceSocketBridge<RoleRow, AdminRolesListParams>({
    resourceName: "roles",
    queryKey: queryKeys.adminRoles.all() as unknown[],
    eventNames: {
      upsert: "role:upsert",
      remove: "role:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as RoleUpsertPayload
      // Update detail query cache nếu có
      const detailQueryKey = queryKeys.adminRoles.detail(p.role.id)
      const currentDetailData = queryClient.getQueryData<{ data: RoleRow }>(detailQueryKey)
      if (currentDetailData) {
        queryClient.setQueryData(detailQueryKey, {
          data: p.role,
        })
      }
      return p.role
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as RoleRemovePayload
      return p.id
    },
    getRowStatus: (row) => (row.deletedAt ? "deleted" : "active"),
    matchesSearch,
    matchesFilters,
  })

  return bridge
}

