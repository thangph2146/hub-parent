import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { TagRow } from "../types"

export const useTagDeleteConfirm = () => useDeleteConfirm<TagRow>()

