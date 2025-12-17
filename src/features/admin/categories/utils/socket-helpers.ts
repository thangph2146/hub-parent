import type { CategoryRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<CategoryRow>(["name", "slug", "description"])

export const matchesFilters = createMatchesFilters<CategoryRow>(["name", "slug"])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

