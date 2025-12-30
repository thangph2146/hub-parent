/**
 * Helper functions để tạo các resource hooks tự động
 * Giúp tạo feature mới nhanh chóng và đồng bộ
 */

import { useFeedback } from "./use-feedback"
import { useDeleteConfirm } from "./use-delete-confirm"
import { createResourceActionsHook } from "./create-resource-actions-hook"

/**
 * Tạo feedback hook cho resource
 * Chỉ là re-export của useFeedback để giữ consistency
 */
export const createFeedbackHook = () => useFeedback

/**
 * Tạo delete confirm hook cho resource
 */
export const createDeleteConfirmHook = <TRow extends { id: string }>() => {
  return () => useDeleteConfirm<TRow>()
}

/**
 * Config để tạo tất cả hooks cho một resource
 */
export interface CreateResourceHooksConfig<TRow extends { id: string }> {
  resourceName: string
  messages: {
    DELETE_SUCCESS: string
    DELETE_ERROR: string
    RESTORE_SUCCESS: string
    RESTORE_ERROR: string
    HARD_DELETE_SUCCESS: string
    HARD_DELETE_ERROR: string
    BULK_DELETE_SUCCESS: string
    BULK_DELETE_ERROR: string
    BULK_RESTORE_SUCCESS: string
    BULK_RESTORE_ERROR: string
    BULK_HARD_DELETE_SUCCESS: string
    BULK_HARD_DELETE_ERROR: string
    UNKNOWN_ERROR: string
  }
  getRecordName: (row: TRow) => string
  getLogMetadata?: (row: TRow) => Record<string, unknown>
}

/**
 * Tạo tất cả hooks cần thiết cho một resource
 * 
 * @example
 * ```ts
 * const { useActions, useFeedback, useDeleteConfirm } = createResourceHooks<PostRow>({
 *   resourceName: "posts",
 *   messages: POST_MESSAGES,
 *   getRecordName: (row) => row.title,
 *   getLogMetadata: (row) => ({ postId: row.id, postTitle: row.title }),
 * })
 * 
 * export const usePostActions = useActions
 * export const usePostFeedback = useFeedback
 * export const usePostDeleteConfirm = useDeleteConfirm
 * ```
 */
export const createResourceHooks = <TRow extends { id: string }>(
  config: CreateResourceHooksConfig<TRow>
) => {
  const useActions = createResourceActionsHook<TRow>(config)
  const useFeedback = createFeedbackHook()
  const useDeleteConfirm = createDeleteConfirmHook<TRow>()

  return {
    useActions,
    useFeedback,
    useDeleteConfirm,
  }
}

