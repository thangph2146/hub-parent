/**
 * Helper function để tạo resource actions hooks
 * Giảm code duplication trong các resource hooks
 */

import { useResourceActions } from "./use-resource-actions"
import { apiRoutes } from "@/lib/api/routes"
import { queryKeys } from "@/lib/query-keys"
import type { FeedbackVariant } from "@/components/dialogs"

export interface ResourceActionsConfig<TRow extends { id: string }> {
  resourceName: string
  queryKeyFn: () => readonly unknown[]
  apiRoutes: {
    delete: (id: string) => string
    restore: (id: string) => string
    hardDelete: (id: string) => string
    bulk: string
  }
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

export interface UseResourceActionsOptions {
  canDelete: boolean
  canRestore: boolean
  canManage: boolean
  showFeedback: (variant: FeedbackVariant, title: string, description?: string, details?: string) => void
}

export const createResourceActionsHook = <TRow extends { id: string }>(
  config: ResourceActionsConfig<TRow>
) => {
  return function useActions(options: UseResourceActionsOptions) {
    return useResourceActions<TRow>({
      resourceName: config.resourceName,
      queryKeys: {
        all: config.queryKeyFn,
      },
      apiRoutes: config.apiRoutes,
      messages: config.messages,
      getRecordName: config.getRecordName,
      permissions: {
        canDelete: options.canDelete,
        canRestore: options.canRestore,
        canManage: options.canManage,
      },
      showFeedback: options.showFeedback,
      getLogMetadata: config.getLogMetadata,
    })
  }
}

/**
 * Type guard để kiểm tra resource routes có đầy đủ methods không
 */
function isResourceRoutes(
  routes: unknown
): routes is {
  delete: (id: string) => string
  restore: (id: string) => string
  hardDelete: (id: string) => string
  bulk: string
} {
  if (!routes || typeof routes !== "object") return false
  const r = routes as Record<string, unknown>
  return (
    typeof r.delete === "function" &&
    typeof r.restore === "function" &&
    typeof r.hardDelete === "function" &&
    typeof r.bulk === "string"
  )
}

export const createApiRoutesConfig = (resourceName: string) => {
  const routes = apiRoutes[resourceName as keyof typeof apiRoutes]

  if (!isResourceRoutes(routes)) {
    throw new Error(
      `API routes not found or invalid for resource: ${resourceName}. ` +
        `Available resources: ${Object.keys(apiRoutes).filter((k) => isResourceRoutes(apiRoutes[k as keyof typeof apiRoutes])).join(", ")}`
    )
  }

  return {
    delete: routes.delete,
    restore: routes.restore,
    hardDelete: routes.hardDelete,
    bulk: routes.bulk,
  }
}

const isQueryKeysWithAll = (keys: unknown): keys is { all: () => readonly unknown[] } => {
  if (!keys || typeof keys !== "object") return false
  const k = keys as Record<string, unknown>
  return typeof k.all === "function"
}

export const createQueryKeysConfig = (resourceName: string) => {
  // Convert "products" -> "adminProducts", "orders" -> "adminOrders"
  const keyName = `admin${resourceName.charAt(0).toUpperCase() + resourceName.slice(1)}` as keyof typeof queryKeys
  const keys = queryKeys[keyName]

  if (!isQueryKeysWithAll(keys)) {
    const availableKeys = Object.keys(queryKeys)
      .filter((k) => isQueryKeysWithAll(queryKeys[k as keyof typeof queryKeys]))
      .join(", ")
    throw new Error(
      `Query keys not found for resource: ${resourceName} (looking for: ${keyName}). ` +
        `Available keys: ${availableKeys}`
    )
  }

  return () => keys.all()
}

