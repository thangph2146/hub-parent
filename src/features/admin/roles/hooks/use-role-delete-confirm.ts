import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { RoleRow } from "../types"

export const useRoleDeleteConfirm = () => useDeleteConfirm<RoleRow>()

