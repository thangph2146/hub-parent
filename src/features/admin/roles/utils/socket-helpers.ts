import type { RoleRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<RoleRow>([
  "name",
  (row) => row.displayName ?? "",
  (row) => row.description ?? "",
])

export const matchesFilters = createMatchesFilters<RoleRow>([
  "isActive",
  "name",
  { field: "displayName", getValue: (row) => row.displayName ?? "" },
])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }


