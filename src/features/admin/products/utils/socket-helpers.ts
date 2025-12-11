import type { ProductRow } from "../types"
import {
  createMatchesSearch,
  createMatchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "@/features/admin/resources/utils/socket-helpers"

// Product-specific search fields
export const matchesSearch = createMatchesSearch<ProductRow>([
  "name",
  "sku",
  "slug",
  (row) => row.categories?.map((cat) => cat.name).join(" "),
])

// Product-specific filter fields
export const matchesFilters = createMatchesFilters<ProductRow>(["status", "featured"])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

