/**
 * Resource Logger - Logger chuẩn cho data table và data detail
 * 
 * Cung cấp logging chuẩn để theo dõi:
 * - Cấu trúc dữ liệu đầy đủ của table (columns, rows, pagination)
 * - Cấu trúc dữ liệu đầy đủ của record detail (tất cả fields)
 * - Các action đang được sử dụng
 * - Working flow chi tiết
 * - Action tracking cho data table và data detail
 */

import { logger } from "./logger"
import type { ResourceLogContext, DataStructureLog, ActionFlowLog, ResourceAction } from "@/types"

/**
 * Main Resource Logger
 */
export const resourceLogger = {
  /**
   * Log data structure (Table or Detail)
   */
  logStructure: (config: DataStructureLog) => {
    const { resource, dataType, structure, rowCount } = config
    const message = `[Structure] ${resource} ${dataType}`
    
    // Tạo data object sạch để log
    const logData = {
      resource,
      dataType,
      rowCount,
      ...structure
    }

    logger.debug(message, logData)
  },

  /**
   * Log action flow (start, success, error)
   */
  logFlow: (config: ActionFlowLog) => {
    const { resource, action, step, details, durationMs } = config
    const stepEmoji = {
      init: "🆕",
      start: "🚀",
      success: "✅",
      error: "❌",
      end: "🏁"
    }[step]

    const message = `${stepEmoji} [${resource}] ${action} - ${step.toUpperCase()}`
    
    const logData = {
      resource,
      action,
      step,
      durationMs,
      ...details
    }

    if (step === "error") {
      logger.error(message, logData)
    } else if (step === "success") {
      logger.success(message, logData)
    } else {
      logger.info(message, logData)
    }
  },

  /**
   * Log socket events
   */
  socket: (config: {
    resource: string
    action: string
    event: string
    payload: Record<string, unknown>
    resourceId?: string
  }) => {
    const { resource, action, event, payload, resourceId } = config
    const message = `📡 [Socket:${resource}] ${action} - ${event}${resourceId ? ` (${resourceId})` : ""}`
    logger.info(message, payload)
  },

  /**
   * Log cache events
   */
  cache: (config: {
    resource: string
    action: string
    key: string
    status: "hit" | "miss" | "set" | "del" | "clear"
    details?: Record<string, unknown>
  }) => {
    const { resource, action, key, status, details } = config
    const statusEmoji = {
      hit: "🎯",
      miss: "❓",
      set: "💾",
      del: "🗑️",
      clear: "🧹",
    }[status]
    const message = `${statusEmoji} [Cache:${resource}] ${action} - ${status.toUpperCase()}: ${key}`
    logger.debug(message, { ...config, ...details })
  },

  /**
   * Quick context log
   */
  logAction: (ctx: ResourceLogContext) => {
    const { resource, action, resourceId, ...rest } = ctx
    const message = `[Action] ${resource}:${action}${resourceId ? `(${resourceId})` : ""}`
    logger.info(message, rest)
  }
}

/**
 * High-level helper for resource operations
 */
export const createResourceLogger = (resource: string) => ({
  table: (structure: DataStructureLog["structure"], rowCount?: number) => 
    resourceLogger.logStructure({ resource, dataType: "table", structure, rowCount }),
  
  detail: (fields: Record<string, unknown>) => 
    resourceLogger.logStructure({ resource, dataType: "detail", structure: { fields } }),
    
  flow: (action: ResourceAction, step: ActionFlowLog["step"], details?: Record<string, unknown>, durationMs?: number) =>
    resourceLogger.logFlow({ resource, action, step, details, durationMs }),
    
  action: (action: ResourceAction, resourceId?: string, details?: Record<string, unknown>) =>
    resourceLogger.logAction({ resource, action, resourceId, ...details })
})
