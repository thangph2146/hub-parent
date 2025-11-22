/**
 * Resource Logger - Logger chuẩn cho data table và data detail
 * 
 * Cung cấp logging chuẩn để theo dõi:
 * - Cấu trúc dữ liệu
 * - Các action đang được sử dụng
 * - Working flow
 * - Action tracking cho data table và data detail
 */

import { logger } from "./logger"

/**
 * Action types cho resource operations
 */
export type ResourceAction =
  | "load-table"
  | "load-detail"
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "hard-delete"
  | "toggle-status"
  | "bulk-delete"
  | "bulk-restore"
  | "bulk-hard-delete"
  | "cache-invalidate"
  | "cache-refresh"
  | "socket-update"
  | "error"
  | "publish"
  | "unpublish"

/**
 * Resource context cho logging
 */
export interface ResourceLogContext {
  resource: string
  action: ResourceAction
  resourceId?: string
  [key: string]: unknown
}

/**
 * Data structure logging
 */
export interface DataStructureLog {
  resource: string
  dataType: "table" | "detail" | "form"
  structure: Record<string, unknown>
  rowCount?: number
}

/**
 * Action flow logging
 */
export interface ActionFlowLog {
  resource: string
  action: ResourceAction
  step: "init" | "start" | "success" | "error" | "end"
  duration?: number
  metadata?: Record<string, unknown>
}

/**
 * Resource Logger instance
 */
export const resourceLogger = {
  /**
   * Log action cho data table
   */
  tableAction: (context: ResourceLogContext & { view?: string; page?: number; total?: number }) => {
    logger.debug(`[${context.resource.toUpperCase()}] Table Action: ${context.action}`, {
      action: context.action,
      resource: context.resource,
      view: context.view,
      page: context.page,
      total: context.total,
      resourceId: context.resourceId,
      ...Object.fromEntries(
        Object.entries(context).filter(([key]) => !["resource", "action", "resourceId", "view", "page", "total"].includes(key))
      ),
    })
  },

  /**
   * Log action cho data detail
   */
  detailAction: (context: ResourceLogContext & { resourceId: string }) => {
    logger.debug(`[${context.resource.toUpperCase()}] Detail Action: ${context.action}`, {
      action: context.action,
      resource: context.resource,
      resourceId: context.resourceId,
      ...Object.fromEntries(
        Object.entries(context).filter(([key]) => !["resource", "action", "resourceId"].includes(key))
      ),
    })
  },

  /**
   * Log data structure
   */
  dataStructure: (log: DataStructureLog) => {
    logger.debug(`[${log.resource.toUpperCase()}] Data Structure: ${log.dataType}`, {
      resource: log.resource,
      dataType: log.dataType,
      structure: log.structure,
      rowCount: log.rowCount,
    })
  },

  /**
   * Log action flow
   */
  actionFlow: (log: ActionFlowLog) => {
    const emoji = {
      start: "▶️",
      success: "✅",
      error: "❌",
      init: "🔄",
      end: "🏁",
    }[log.step]

    logger.debug(`${emoji} [${log.resource.toUpperCase()}] Action Flow: ${log.action} - ${log.step}`, {
      resource: log.resource,
      action: log.action,
      step: log.step,
      duration: log.duration,
      ...log.metadata,
    })
  },

  /**
   * Log cache operations
   */
  cache: (context: ResourceLogContext & { operation: "invalidate" | "refresh" | "update"; tags?: string[] }) => {
    logger.debug(`[${context.resource.toUpperCase()}] Cache ${context.operation}`, {
      resource: context.resource,
      operation: context.operation,
      resourceId: context.resourceId,
      tags: context.tags,
      ...Object.fromEntries(
        Object.entries(context).filter(([key]) => !["resource", "operation", "resourceId", "tags"].includes(key))
      ),
    })
  },

  /**
   * Log socket operations
   */
  socket: (context: ResourceLogContext & { event: string; payload?: unknown }) => {
    logger.debug(`[${context.resource.toUpperCase()}] Socket: ${context.event}`, {
      resource: context.resource,
      event: context.event,
      action: context.action,
      resourceId: context.resourceId,
      payload: context.payload,
      ...Object.fromEntries(
        Object.entries(context).filter(([key]) => !["resource", "event", "action", "resourceId", "payload"].includes(key))
      ),
    })
  },
}

