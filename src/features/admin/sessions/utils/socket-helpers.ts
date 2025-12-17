import type { SessionRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<SessionRow>([
  (row) => row.userName ?? "",
  "userEmail",
  (row) => row.ipAddress ?? "",
  (row) => row.userAgent ?? "",
])

export const matchesFilters = createMatchesFilters<SessionRow>([
  "isActive",
  { field: "ipAddress", getValue: (row) => row.ipAddress ?? "" },
  { field: "userAgent", getValue: (row) => row.userAgent ?? "" },
  { field: "userName", getValue: (row) => row.userName ?? "" },
  "userEmail",
])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

export const convertSocketPayloadToRow = (
  payload: {
    id: string
    userId: string
    userName?: string | null
    userEmail: string
    accessToken: string
    refreshToken: string
    userAgent?: string | null
    ipAddress?: string | null
    isActive: boolean
    expiresAt: string
    lastActivity: string
    createdAt: string
  }
): SessionRow => {
  return {
    id: payload.id,
    userId: payload.userId,
    userName: payload.userName ?? null,
    userEmail: payload.userEmail,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    userAgent: payload.userAgent ?? null,
    ipAddress: payload.ipAddress ?? null,
    isActive: payload.isActive,
    expiresAt: payload.expiresAt,
    lastActivity: payload.lastActivity,
    createdAt: payload.createdAt,
    deletedAt: null, // Session model không có deletedAt
  }
}

