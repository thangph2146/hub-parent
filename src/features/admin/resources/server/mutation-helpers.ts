/**
 * Shared Mutation Helpers for Admin Features
 * 
 * Các helper functions được dùng chung bởi tất cả admin features
 * để đảm bảo consistency, giảm duplicate code và loại bỏ cache update
 * 
 * Theo chuẩn Next.js 16: Chỉ invalidate queries, không update cache manually
 */

import type { Permission } from "@/lib/permissions"
import { canPerformAction } from "@/lib/permissions"
import { resourceLogger, type ResourceAction } from "@/lib/config"
import { ForbiddenError } from "./errors"

/**
 * Auth context interface
 * Được sử dụng trong tất cả mutations để check permissions
 */
export interface AuthContext {
  actorId: string
  permissions: Permission[]
  roles: Array<{ name: string }>
}

/**
 * Ensure user has at least one of the required permissions
 * 
 * @param ctx - Auth context
 * @param required - Array of required permissions (user needs at least one)
 * @throws ForbiddenError if user doesn't have any required permission
 */
export function ensurePermission(ctx: AuthContext, ...required: Permission[]): void {
  const allowed = required.some((perm) => canPerformAction(ctx.permissions, ctx.roles, perm))
  if (!allowed) {
    throw new ForbiddenError()
  }
}

/**
 * Helper để log table status sau mutations
 * Log đầy đủ thông tin về trạng thái table (active count, deleted count, etc.)
 */
export async function logTableStatusAfterMutation(options: {
  resource: string
  action: "delete" | "restore" | "bulk-delete" | "bulk-restore"
  prismaModel: {
    count: (args?: { where?: { deletedAt?: Date | null | { not?: Date | null } } }) => Promise<number>
  }
  affectedIds: string | string[]
  affectedCount?: number
}): Promise<void> {
  const { resource, action, prismaModel, affectedIds, affectedCount } = options
  
  resourceLogger.actionFlow({
    resource,
    action,
    step: "start",
    metadata: { 
      loggingTableStatus: true, 
      affectedCount,
      affectedIds: Array.isArray(affectedIds) ? affectedIds.length : 1,
    },
  })

  const [activeCount, deletedCount] = await Promise.all([
    prismaModel.count({ where: { deletedAt: null } }),
    prismaModel.count({ where: { deletedAt: { not: null } } }),
  ])

  const isBulk = action.startsWith("bulk-")
  const singularResource = resource.endsWith("s") ? resource.slice(0, -1) : resource
  const resourceIdKey = `${singularResource}Id`
  const resourceIdsKey = `${singularResource}Ids`
  
  const structure = isBulk
    ? {
        action,
        deletedCount: action === "bulk-delete" ? affectedCount : undefined,
        restoredCount: action === "bulk-restore" ? affectedCount : undefined,
        currentActiveCount: activeCount,
        currentDeletedCount: deletedCount,
        [resourceIdsKey]: Array.isArray(affectedIds) ? affectedIds : [affectedIds],
        summary: action === "bulk-delete" 
          ? `Đã xóa ${affectedCount} ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`
          : `Đã khôi phục ${affectedCount} ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`,
      }
    : {
        action,
        currentActiveCount: activeCount,
        currentDeletedCount: deletedCount,
        [resourceIdKey]: typeof affectedIds === "string" ? affectedIds : affectedIds[0],
        summary: action === "delete"
          ? `Đã xóa 1 ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`
          : `Đã khôi phục 1 ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`,
      }

  resourceLogger.dataStructure({
    resource,
    dataType: "table",
    structure: {
      tableStatus: {
        activeCount,
        deletedCount,
        affectedCount,
        affectedIds: Array.isArray(affectedIds) ? affectedIds : [affectedIds],
        summary: structure.summary,
      },
    },
  })

  resourceLogger.actionFlow({
    resource,
    action,
    step: "success",
    metadata: {
      tableStatusLogged: true,
      activeCount,
      deletedCount,
      affectedCount,
      summary: structure.summary,
    },
  })
}

/**
 * Helper để log action flow với timing
 */
export function logActionFlow(
  resource: string,
  action: ResourceAction,
  step: "init" | "start" | "success" | "error" | "end",
  metadata?: Record<string, unknown>,
  startTime?: number
): void {
  const duration = startTime ? Date.now() - startTime : undefined
  resourceLogger.actionFlow({
    resource,
    action,
    step,
    duration,
    metadata,
  })
}

/**
 * Helper để log detail action với đầy đủ thông tin record
 */
export function logDetailAction(
  resource: string,
  action: ResourceAction,
  resourceId: string,
  recordData?: Record<string, unknown>
): void {
  resourceLogger.detailAction({
    resource,
    action,
    resourceId,
    recordData,
    fields: recordData ? Object.keys(recordData) : undefined,
  })
}

