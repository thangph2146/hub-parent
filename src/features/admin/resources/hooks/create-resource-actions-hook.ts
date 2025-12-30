/**
 * Helper để tạo resource actions hook tự động
 * Giúp tạo feature mới nhanh chóng và đồng bộ
 */

import { useResourceActions } from "./use-resource-actions"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import type { FeedbackVariant } from "@/components/dialogs"

export interface CreateResourceActionsHookConfig<TRow extends { id: string }> {
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

export interface UseResourceActionsHookOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  isSocketConnected?: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

/**
 * Tạo resource actions hook tự động
 * 
 * @example
 * ```ts
 * export const usePostActions = createResourceActionsHook<PostRow>({
 *   resourceName: "posts",
 *   messages: POST_MESSAGES,
 *   getRecordName: (row) => row.title,
 *   getLogMetadata: (row) => ({ postId: row.id, postTitle: row.title }),
 * })
 * ```
 */
export const createResourceActionsHook = <TRow extends { id: string }>(
  config: CreateResourceActionsHookConfig<TRow>
) => {
  return function useActions(options: UseResourceActionsHookOptions) {
    const resourceName = config.resourceName
    const queryKeyName = `admin${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}` as keyof typeof queryKeys
    const apiRouteName = resourceName as keyof typeof apiRoutes

    const adminQueryKeys = queryKeys[queryKeyName]
    const adminApiRoutes = apiRoutes[apiRouteName]

    // Type guard để kiểm tra query keys
    if (!adminQueryKeys || typeof (adminQueryKeys as { all?: () => unknown }).all !== "function") {
      throw new Error(`Query keys not found for resource: ${resourceName}`)
    }

    // Type guard để kiểm tra API routes
    if (!adminApiRoutes || typeof (adminApiRoutes as { delete?: (id: string) => string }).delete !== "function") {
      throw new Error(`API routes not found for resource: ${resourceName}`)
    }

    const typedQueryKeys = adminQueryKeys as { all: () => readonly unknown[]; detail?: (id: string) => readonly unknown[] }
    const typedApiRoutes = adminApiRoutes as {
      delete: (id: string) => string
      restore: (id: string) => string
      hardDelete: (id: string) => string
      bulk: string
    }

    return useResourceActions<TRow>({
      resourceName,
      queryKeys: {
        all: () => typedQueryKeys.all(),
        detail: (id) => typedQueryKeys.detail?.(id) || [],
      },
      apiRoutes: {
        delete: (id) => typedApiRoutes.delete(id),
        restore: (id) => typedApiRoutes.restore(id),
        hardDelete: (id) => typedApiRoutes.hardDelete(id),
        bulk: typedApiRoutes.bulk,
      },
      messages: config.messages,
      getRecordName: config.getRecordName,
      permissions: {
        canDelete: options.canDelete,
        canRestore: options.canRestore,
        canManage: options.canManage,
      },
      showFeedback: options.showFeedback,
      isSocketConnected: options.isSocketConnected,
      getLogMetadata: config.getLogMetadata,
    })
  }
}

