/**
 * Helper để tạo resource actions hook tự động
 * Giúp tạo feature mới nhanh chóng và đồng bộ
 */

import { useResourceActions } from "./use-resource-actions"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys, createAdminResourceKeys } from "@/lib/query-keys"
import { generateResourceApiRoutes } from "@/lib/permissions/api-route-generators"
import type { FeedbackVariant } from "@/components/dialogs"

type ResourceActionApiRoutes = {
  delete: (id: string) => string
  restore: (id: string) => string
  hardDelete: (id: string) => string
  bulk: string
}

type ResourceActionQueryKeys = {
  all: () => readonly unknown[]
  detail?: (id: string) => readonly unknown[]
}

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
  customApiRoutes?: ResourceActionApiRoutes
  customQueryKeys?: ResourceActionQueryKeys
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
    const queryKeyName = `admin${capitalize(resourceName)}` as keyof typeof queryKeys
    const apiRouteName = resourceName as keyof typeof apiRoutes

    const resolvedQueryKeys = resolveQueryKeys(config.customQueryKeys, queryKeys[queryKeyName], queryKeyName)
    const resolvedApiRoutes = resolveApiRoutes(config.customApiRoutes, apiRoutes[apiRouteName], resourceName)

    return useResourceActions<TRow>({
      resourceName,
      queryKeys: {
        all: () => resolvedQueryKeys.all(),
        detail: resolvedQueryKeys.detail
          ? (id: string) => resolvedQueryKeys.detail!(id)
          : undefined,
      },
      apiRoutes: {
        delete: (id) => resolvedApiRoutes.delete(id),
        restore: (id) => resolvedApiRoutes.restore(id),
        hardDelete: (id) => resolvedApiRoutes.hardDelete(id),
        bulk: resolvedApiRoutes.bulk,
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

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

const isResourceRoutes = (routes: unknown): routes is ResourceActionApiRoutes => {
  if (!routes || typeof routes !== "object") return false
  const candidate = routes as Record<string, unknown>
  return (
    typeof candidate.delete === "function" &&
    typeof candidate.restore === "function" &&
    typeof candidate.hardDelete === "function" &&
    typeof candidate.bulk === "string"
  )
}

const isQueryKeysConfig = (keys: unknown): keys is ResourceActionQueryKeys => {
  if (!keys || typeof keys !== "object") return false
  const candidate = keys as Record<string, unknown>
  return typeof candidate.all === "function"
}

const resolveApiRoutes = (
  override: ResourceActionApiRoutes | undefined,
  preset: unknown,
  resourceName: string
): ResourceActionApiRoutes => {
  if (override) {
    return override
  }

  if (isResourceRoutes(preset)) {
    return preset
  }

  return generateResourceApiRoutes(resourceName)
}

const resolveQueryKeys = (
  override: ResourceActionQueryKeys | undefined,
  preset: unknown,
  queryKeyName: string
): ResourceActionQueryKeys => {
  if (override) {
    return override
  }

  if (isQueryKeysConfig(preset)) {
    return preset
  }

  return createAdminResourceKeys(queryKeyName)
}

/**
 * Helper để tạo API routes config từ resource name
 * Fallback tự động nếu không tìm thấy trong apiRoutes
 */
export const createApiRoutesConfig = (resourceName: string): ResourceActionApiRoutes => {
  const routes = apiRoutes[resourceName as keyof typeof apiRoutes]

  if (isResourceRoutes(routes)) {
    return routes
  }

  // Fallback: tự động generate từ resource name
  return generateResourceApiRoutes(resourceName)
}

const isQueryKeysWithAll = (keys: unknown): keys is { all: () => readonly unknown[] } => {
  if (!keys || typeof keys !== "object") return false
  const candidate = keys as Record<string, unknown>
  return typeof candidate.all === "function"
}

/**
 * Helper để tạo query keys config từ resource name
 * Fallback tự động nếu không tìm thấy trong queryKeys
 */
export const createQueryKeysConfig = (resourceName: string): () => readonly unknown[] => {
  const keyName = `admin${capitalize(resourceName)}` as keyof typeof queryKeys
  const keys = queryKeys[keyName]

  if (isQueryKeysWithAll(keys)) {
    return () => keys.all()
  }

  // Fallback: tự động tạo từ resource name
  const fallbackKeys = createAdminResourceKeys(keyName)
  return () => fallbackKeys.all()
}
