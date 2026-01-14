import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { UserRow } from "../types"

export const useUserDeleteConfirm = () => useDeleteConfirm<UserRow, "soft" | "hard" | "restore" | "active" | "unactive">()

