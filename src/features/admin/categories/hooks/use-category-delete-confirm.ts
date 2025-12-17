import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { CategoryRow } from "../types"

export const useCategoryDeleteConfirm = () => useDeleteConfirm<CategoryRow>()

