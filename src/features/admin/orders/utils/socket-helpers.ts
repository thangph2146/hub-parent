import type { OrderRow } from "../types"
import {
  createMatchesSearch,
  createMatchesFilters,
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
} from "@/features/admin/resources/utils/socket-helpers"

// Order-specific search fields
export const matchesSearch = createMatchesSearch<OrderRow>([
  "orderNumber",
  "customerName",
  "customerEmail",
  "customerPhone",
])

// Order-specific filter fields
export const matchesFilters = createMatchesFilters<OrderRow>(["status", "paymentStatus"])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

