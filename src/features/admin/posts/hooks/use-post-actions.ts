import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { PostRow } from "../types"
import { POST_MESSAGES } from "../constants/messages"

export const usePostActions = createResourceActionsHook<PostRow>({
  resourceName: "posts",
  resourceDisplayName: "bài viết",
  messages: POST_MESSAGES,
  getRecordName: (row) => row.title,
  getLogMetadata: (row) => ({ postId: row.id, postTitle: row.title }),
})

