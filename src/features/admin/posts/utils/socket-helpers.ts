import type { PostRow } from "../types"
import {
  shouldIncludeInStatus,
  insertRowIntoPage,
  removeRowFromPage,
  createMatchesSearch,
  createMatchesFilters,
} from "@/features/admin/resources/utils/socket-helpers"

export const matchesSearch = createMatchesSearch<PostRow>(["title", "slug", "excerpt"])

export const matchesFilters = createMatchesFilters<PostRow>([
  "title",
  "slug",
  "published",
  { field: "authorId", getValue: (row) => row.author.id },
])

// Re-export generic helpers
export { shouldIncludeInStatus, insertRowIntoPage, removeRowFromPage }

