import type { SessionRow } from "../types"
import type { AdminSessionsListParams } from "@/lib/query-keys"

export function matchesSearch(search: string | undefined, row: SessionRow): boolean {
  if (!search || typeof search !== "string") return true
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [
    row.userName ?? "",
    row.userEmail,
    row.ipAddress ?? "",
    row.userAgent ?? "",
  ].some((value) => value.toLowerCase().includes(term))
}

export function matchesFilters(
  filters: AdminSessionsListParams["filters"],
  row: SessionRow
): boolean {
  if (!filters) return true
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "") continue
    switch (key) {
      case "isActive": {
        const expected = value === "true"
        if (row.isActive !== expected) return false
        break
      }
      case "ipAddress":
        if ((row.ipAddress ?? "") !== value) return false
        break
      case "userAgent":
        if ((row.userAgent ?? "") !== value) return false
        break
      case "userName":
        if ((row.userName ?? "") !== value) return false
        break
      case "userEmail":
        if (row.userEmail !== value) return false
        break
      default:
        break
    }
  }
  return true
}

export function shouldIncludeInStatus(
  paramsStatus: AdminSessionsListParams["status"],
  rowStatus: "active" | "deleted"
): boolean {
  if (paramsStatus === "all") return true
  if (!paramsStatus) return rowStatus === "active"
  return paramsStatus === rowStatus
}

export function insertRowIntoPage(
  rows: SessionRow[],
  row: SessionRow,
  limit: number
): SessionRow[] {
  const existingIndex = rows.findIndex((item) => item.id === row.id)
  if (existingIndex >= 0) {
    const next = [...rows]
    next[existingIndex] = row
    return next
  }
  const next = [row, ...rows]
  if (next.length > limit) {
    next.pop()
  }
  return next
}

export function removeRowFromPage(
  rows: SessionRow[],
  id: string
): { rows: SessionRow[]; removed: boolean } {
  const index = rows.findIndex((item) => item.id === id)
  if (index === -1) return { rows, removed: false }
  const next = [...rows]
  next.splice(index, 1)
  return { rows: next, removed: true }
}

export function convertSocketPayloadToRow(
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
): SessionRow {
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

