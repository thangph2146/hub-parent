"use client"

import { useDeleteConfirm } from "@/features/admin/resources/hooks"
import type { Group } from "@/components/chat/types"

export const useGroupDeleteConfirm = () => useDeleteConfirm<Group>()

