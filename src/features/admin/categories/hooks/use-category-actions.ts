import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { CategoryRow } from "../types"
import { CATEGORY_MESSAGES } from "../constants/messages"

export const useCategoryActions = createResourceActionsHook<CategoryRow>({
  resourceName: "categories",
  messages: CATEGORY_MESSAGES,
  getRecordName: (row) => row.name,
  getLogMetadata: (row) => ({ categoryId: row.id, categoryName: row.name }),
})

