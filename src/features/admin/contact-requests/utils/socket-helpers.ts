import type { ContactRequestRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<ContactRequestRow>([
  "name",
  "email",
  (row) => row.phone ?? "",
  "subject",
  (row) => row.assignedToName ?? "",
])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

export const matchesFilters = createMatchesFilters<ContactRequestRow>([
  "status",
  "priority",
  "isRead",
  "name",
  "email",
  { field: "phone", getValue: (row) => row.phone ?? "" },
  "subject",
])

export const convertSocketPayloadToRow = (
  payload: {
    id: string
    name: string
    email: string
    phone?: string | null
    subject: string
    status: string
    priority: string
    createdAt: string
    assignedToId?: string | null
  },
  assignedToName?: string | null
): ContactRequestRow => {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone ?? null,
    subject: payload.subject,
    status: payload.status as ContactRequestRow["status"],
    priority: payload.priority as ContactRequestRow["priority"],
    isRead: false, // Default, sẽ được update từ server
    assignedToName: assignedToName ?? null,
    createdAt: payload.createdAt,
    updatedAt: payload.createdAt,
    deletedAt: null,
  }
}

