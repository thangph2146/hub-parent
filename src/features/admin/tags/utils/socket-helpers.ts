import type { TagRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<TagRow>(["name", "slug"])

export const matchesFilters = createMatchesFilters<TagRow>(["name", "slug"])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

