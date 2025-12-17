import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { PostRow } from "../types"

export const usePostDeleteConfirm = () => useDeleteConfirm<PostRow>()

