import type { Permission } from "@/lib/permissions"
import { canPerformAction } from "@/lib/permissions"
import { resourceLogger, type ResourceAction } from "@/lib/config"
import { ForbiddenError } from "./errors"

export interface AuthContext {
  actorId: string
  permissions: Permission[]
  roles: Array<{ name: string }>
}

export function ensurePermission(ctx: AuthContext, ...required: Permission[]): void {
  if (!required.some((perm) => canPerformAction(ctx.permissions, ctx.roles, perm))) {
    throw new ForbiddenError()
  }
}

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
  
  resourceLogger.actionFlow({ resource, action, step: "start", metadata: { loggingTableStatus: true, affectedCount } })

  const [activeCount, deletedCount] = await Promise.all([
    prismaModel.count({ where: { deletedAt: null } }),
    prismaModel.count({ where: { deletedAt: { not: null } } }),
  ])

  const isBulk = action.startsWith("bulk-")
  const ids = Array.isArray(affectedIds) ? affectedIds : [affectedIds]
  const summary = isBulk
    ? `Đã ${action === "bulk-delete" ? "xóa" : "khôi phục"} ${affectedCount} ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`
    : `Đã ${action === "delete" ? "xóa" : "khôi phục"} 1 ${resource}. Hiện tại: ${activeCount} active, ${deletedCount} đã xóa`

  resourceLogger.dataStructure({
    resource,
    dataType: "table",
    structure: { tableStatus: { activeCount, deletedCount, affectedCount, affectedIds: ids, summary } },
  })

  resourceLogger.actionFlow({
    resource,
    action,
    step: "success",
    metadata: { tableStatusLogged: true, activeCount, deletedCount, affectedCount, summary },
  })
}

export function logActionFlow(
  resource: string,
  action: ResourceAction,
  step: "init" | "start" | "success" | "error" | "end",
  metadata?: Record<string, unknown>,
  startTime?: number
): void {
  resourceLogger.actionFlow({ resource, action, step, duration: startTime ? Date.now() - startTime : undefined, metadata })
}

export function logDetailAction(
  resource: string,
  action: ResourceAction,
  resourceId: string,
  recordData?: Record<string, unknown>
): void {
  resourceLogger.detailAction({ resource, action, resourceId, recordData, fields: recordData ? Object.keys(recordData) : undefined })
}

