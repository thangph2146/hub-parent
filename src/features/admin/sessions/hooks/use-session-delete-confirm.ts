import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { SessionRow } from "../types"

export const useSessionDeleteConfirm = () => useDeleteConfirm<SessionRow>()

