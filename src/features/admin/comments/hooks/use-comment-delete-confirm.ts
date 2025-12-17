import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { CommentRow } from "../types"

export const useCommentDeleteConfirm = () => useDeleteConfirm<CommentRow>()

