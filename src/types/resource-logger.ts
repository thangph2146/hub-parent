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
  | "active"
  | "unactive"
  | "toggle-status"
  | "bulk-delete"
  | "bulk-restore"
  | "bulk-hard-delete"
  | "bulk-active"
  | "bulk-unactive"
  | "bulk-update"
  | "bulk-approve"
  | "bulk-unapprove"
  | "bulk-mark-read"
  | "bulk-mark-unread"
  | "bulk-update-status"
  | "cache-invalidate"
  | "cache-refresh"
  | "socket-update"
  | "error"
  | "publish"
  | "unpublish"
  | "approve"
  | "unapprove"
  | "query"

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
 * Data structure logging - Log đầy đủ cấu trúc dữ liệu
 */
export interface DataStructureLog {
  resource: string
  dataType: "table" | "detail" | "form"
  structure: {
    // Cho table: columns, rows, pagination, sampleRows
    columns?: string[]
    rows?: Array<Record<string, unknown>> // Backward compatibility
    sampleRows?: Array<Record<string, unknown>> // Hiển thị đầy đủ rows hiện tại
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    // Cho detail: tất cả fields của record
    fields?: Record<string, unknown>
    // Cho table status sau mutation
    tableStatus?: {
      activeCount: number
      deletedCount: number
      affectedCount?: number
      affectedIds?: string[]
      summary?: string
    }
    [key: string]: unknown
  }
  rowCount?: number
}

/**
 * Action flow logging
 */
export interface ActionFlowLog {
  resource: string
  action: ResourceAction
  step: "init" | "start" | "success" | "error" | "end"
  details?: Record<string, unknown>
  durationMs?: number
}
