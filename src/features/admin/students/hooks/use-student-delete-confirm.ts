import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { StudentRow } from "../types"

export const useStudentDeleteConfirm = () => useDeleteConfirm<StudentRow, "soft" | "hard" | "restore">()

