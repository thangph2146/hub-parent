import type { Permission } from "@/permissions"
import { canPerformAction } from "@/permissions"
import { resourceLogger } from "@/utils"
import type { ResourceAction } from "@/types"
import { ForbiddenError } from "./errors"

export interface AuthContext {
  actorId: string
  permissions: Permission[]
  roles: Array<{ name: string }>
}

export const ensurePermission = (ctx: AuthContext, ...required: Permission[]): void => {
  if (!required.some((perm) => canPerformAction(ctx.permissions, ctx.roles, perm))) {
    throw new ForbiddenError()
  }
}

export const logTableStatusAfterMutation = async (options: {
  resource: string
  action: "delete" | "restore" | "bulk-delete" | "bulk-restore"
  prismaModel: {
    count: (args?: { where?: { deletedAt?: Date | null | { not?: Date | null } } }) => Promise<number>
  }
  affectedIds: string | string[]
  affectedCount?: number
}): Promise<void> => {
  const { resource, action, prismaModel, affectedIds, affectedCount } = options
  
  resourceLogger.logFlow({ resource, action, step: "start", details: { loggingTableStatus: true, affectedCount } })

  const [activeCount, deletedCount] = await Promise.all([
    prismaModel.count({ where: { deletedAt: null } }),
    prismaModel.count({ where: { deletedAt: { not: null } } }),
  ])

  const isBulk = action.startsWith("bulk-")
  const ids = Array.isArray(affectedIds) ? affectedIds : [affectedIds]
  const summary = isBulk
    ? `Đã ${action === "bulk-delete" ? "xóa" : "khôi phục"} ${affectedCount} ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`
    : `Đã ${action === "delete" ? "xóa" : "khôi phục"} 1 ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`

  resourceLogger.logStructure({
    resource,
    dataType: "table",
    structure: { tableStatus: { activeCount, deletedCount, affectedCount, affectedIds: ids, summary } },
  })

  resourceLogger.logFlow({
    resource,
    action,
    step: "success",
    details: { tableStatusLogged: true, activeCount, deletedCount, affectedCount, summary },
  })
}

export const logActionFlow = (
  resource: string,
  action: ResourceAction,
  step: "init" | "start" | "success" | "error" | "end",
  metadata?: Record<string, unknown>,
  startTime?: number
): void => {
  resourceLogger.logFlow({ resource, action, step, durationMs: startTime ? Date.now() - startTime : undefined, details: metadata })
}

export const logDetailAction = (
  resource: string,
  action: ResourceAction,
  resourceId: string,
  recordData?: Record<string, unknown>
): void => {
  resourceLogger.logAction({ resource, action, resourceId, recordData, fields: recordData ? Object.keys(recordData) : undefined })
}

