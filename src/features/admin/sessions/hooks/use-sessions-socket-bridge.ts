"use client"

import type { SessionRow } from "../types"
import { queryKeys, type AdminSessionsListParams } from "@/lib/query-keys"
import { useResourceSocketBridge } from "@/features/admin/resources/hooks/use-resource-socket-bridge"
import { matchesSearch, matchesFilters } from "../utils/socket-helpers"

interface SessionUpsertPayload {
  session: SessionRow
  previousStatus: "active" | "deleted" | null
  newStatus: "active" | "deleted"
}

interface SessionRemovePayload {
  id: string
  previousStatus: "active" | "deleted"
}

export const useSessionsSocketBridge = () => {
  return useResourceSocketBridge<SessionRow, AdminSessionsListParams>({
    resourceName: "sessions",
    queryKey: queryKeys.adminSessions.all() as unknown[],
    eventNames: {
      upsert: "session:upsert",
      remove: "session:remove",
    },
    getRowFromPayload: (payload) => {
      const p = payload as SessionUpsertPayload
      return p.session
    },
    getRowIdFromPayload: (payload) => {
      const p = payload as SessionRemovePayload
      return p.id
    },
    getRowStatus: (row) => (row.isActive ? "active" : "deleted"),
    matchesSearch,
    matchesFilters,
  })
}

