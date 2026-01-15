import { createResourceActionsHook } from "@/features/admin/resources/hooks"
import type { CommentRow } from "../types"
import { COMMENT_MESSAGES } from "../constants/messages"
import { apiRoutes, queryKeys } from "@/constants"

export const useCommentActions = createResourceActionsHook<CommentRow>({
  resourceName: "comments",
  resourceDisplayName: "bình luận",
  messages: {
    ...COMMENT_MESSAGES,
    ACTIVE_SUCCESS: COMMENT_MESSAGES.APPROVE_SUCCESS,
    ACTIVE_ERROR: COMMENT_MESSAGES.APPROVE_ERROR,
    UNACTIVE_SUCCESS: COMMENT_MESSAGES.UNAPPROVE_SUCCESS,
    UNACTIVE_ERROR: COMMENT_MESSAGES.UNAPPROVE_ERROR,
    BULK_ACTIVE_SUCCESS: COMMENT_MESSAGES.BULK_APPROVE_SUCCESS,
    BULK_ACTIVE_ERROR: COMMENT_MESSAGES.BULK_APPROVE_ERROR,
    BULK_UNACTIVE_SUCCESS: COMMENT_MESSAGES.BULK_UNAPPROVE_SUCCESS,
    BULK_UNACTIVE_ERROR: COMMENT_MESSAGES.BULK_UNAPPROVE_ERROR,
  },
  getRecordName: (row) => row.authorName || row.authorEmail,
  getLogMetadata: (row) => ({
    commentId: row.id,
    authorName: row.authorName,
    authorEmail: row.authorEmail,
  }),
  customApiRoutes: {
    delete: (id) => apiRoutes.comments.delete(id),
    restore: (id) => apiRoutes.comments.restore(id),
    hardDelete: (id) => apiRoutes.comments.hardDelete(id),
    bulk: apiRoutes.comments.bulk,
  },
  customQueryKeys: {
    all: () => queryKeys.adminComments.all(),
    detail: (id) => queryKeys.adminComments.detail(id),
  },
})
