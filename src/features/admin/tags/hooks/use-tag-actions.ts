import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { TagRow } from "../types"
import { TAG_MESSAGES } from "../constants/messages"

export const useTagActions = createResourceActionsHook<TagRow>({
  resourceName: "tags",
  messages: TAG_MESSAGES,
  getRecordName: (row) => row.name,
  getLogMetadata: (row) => ({ tagId: row.id, tagName: row.name }),
})
