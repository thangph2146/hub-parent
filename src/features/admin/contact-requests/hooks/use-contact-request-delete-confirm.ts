import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { ContactRequestRow } from "../types"

export const useContactRequestDeleteConfirm = () => useDeleteConfirm<ContactRequestRow>()

