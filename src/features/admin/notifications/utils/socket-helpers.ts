import type { NotificationRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<NotificationRow>([
  "title",
  (row) => row.description ?? "",
  (row) => row.userEmail ?? "",
  (row) => row.userName ?? "",
  "kind",
])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

export const matchesFilters = createMatchesFilters<NotificationRow>([
  "isRead",
  "kind",
  { field: "userEmail", getValue: (row) => row.userEmail ?? "" },
  { field: "userName", getValue: (row) => row.userName ?? "" },
])


export const convertSocketPayloadToRow = (
  payload: {
    id: string
    kind: string
    title: string
    description?: string | null
    read?: boolean
    toUserId: string
    timestamp?: number
    actionUrl?: string | null
    userEmail?: string | null
    userName?: string | null
  },
  userEmail?: string | null,
  userName?: string | null,
): NotificationRow => {
  const timestamp = payload.timestamp ?? Date.now()
  return {
    id: payload.id,
    userId: payload.toUserId,
    userEmail: payload.userEmail || userEmail || null,
    userName: payload.userName || userName || null,
    kind: payload.kind.toUpperCase(),
    title: payload.title,
    description: payload.description ?? null,
    isRead: payload.read ?? false,
    actionUrl: payload.actionUrl ?? null,
    createdAt: new Date(timestamp).toISOString(),
    readAt: payload.read ? new Date(timestamp).toISOString() : null,
    expiresAt: null,
  }
}

