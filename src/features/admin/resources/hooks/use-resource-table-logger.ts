import { useEffect, useRef, useMemo, useCallback } from "react"
import type { QueryClient } from "@tanstack/react-query"
import type { DataTableResult } from "@/components/tables"
import { resourceLogger } from "@/lib/config/resource-logger"
import type { QueryKey } from "@tanstack/react-query"

interface UseResourceTableLoggerOptions<T extends object> {
  resourceName: string
  initialData?: DataTableResult<T>
  initialDataByView?: Record<string, DataTableResult<T>>
  currentViewId?: string
  queryClient: QueryClient
  buildQueryKey: (params: { status: "active" | "inactive" | "deleted" | "all"; page: number; limit: number; search?: string; filters?: Record<string, string> }) => QueryKey
  columns: string[]
  getRowData: (row: T) => Record<string, unknown>
  cacheVersion?: number
}

export const useResourceTableLogger = <T extends object>({
  resourceName,
  initialData,
  initialDataByView,
  currentViewId,
  queryClient,
  buildQueryKey,
  columns,
  getRowData,
  cacheVersion: _cacheVersion,
}: UseResourceTableLoggerOptions<T>) => {
  const lastLoggedKeyRef = useRef<string | null>(null)
  const lastViewIdRef = useRef<string | undefined>(undefined)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Xác định view hiện tại và status tương ứng
  const currentViewStatus = useMemo(() => {
    if (currentViewId === "deleted") return "deleted"
    if (currentViewId === "inactive") return "inactive"
    if (currentViewId === "all") return "all"
    return "active"
  }, [currentViewId])

  const currentInitialData = useMemo(() => {
    if (currentViewId && initialDataByView?.[currentViewId]) {
      return initialDataByView[currentViewId]
    }
    return initialData
  }, [currentViewId, initialDataByView, initialData])

  // Build queryKey từ view hiện tại (không cần initialData)
  const currentQueryKey = useMemo(() => {
    const page = currentInitialData?.page ?? 1
    const limit = currentInitialData?.limit ?? 10
    return buildQueryKey({
      status: currentViewStatus,
      page,
      limit,
      search: undefined,
      filters: undefined,
    })
  }, [currentViewStatus, buildQueryKey, currentInitialData?.page, currentInitialData?.limit])

  const logData = useCallback(
    (dataToLog: DataTableResult<T>, viewId: string, viewStatus: string) => {
      if (!dataToLog) return false

      // Đảm bảo rows là một array
      if (!Array.isArray(dataToLog.rows)) {
        return false
      }

      if (dataToLog.rows.length > 0) {
        if (viewStatus === "deleted") {
          const allDeleted = dataToLog.rows.every((r) => {
            const row = r as Record<string, unknown>
            return row.deletedAt !== null && row.deletedAt !== undefined
          })
          if (!allDeleted) {
            return false
          }
        } else if (viewStatus === "active") {
          const allActive = dataToLog.rows.every((r) => {
            const row = r as Record<string, unknown>
            return row.deletedAt === null || row.deletedAt === undefined
          })
          if (!allActive) {
            return false
          }
        } else if (viewStatus === "inactive") {
          const allInactive = dataToLog.rows.every((r) => {
            const row = r as Record<string, unknown>
            return (row.deletedAt === null || row.deletedAt === undefined) && row.isActive === false
          })
          if (!allInactive) {
            return false
          }
        }
      }

      const rowIds = dataToLog.rows
        .map((r) => {
          const row = r as Record<string, unknown>
          return row.id as string
        })
        .sort()
        .join(",")

      const dataKey = `${viewId || "active"}:${dataToLog.page}:${dataToLog.total}:${rowIds}`

      if (lastLoggedKeyRef.current === dataKey && lastViewIdRef.current === viewId) return false

      lastLoggedKeyRef.current = dataKey
      lastViewIdRef.current = viewId

      const allRows = dataToLog.rows.map((row) => getRowData(row as T))

      // Log danh sách chi tiết cho tất cả các resource
      // Tạo tên field động dựa trên resource name (ví dụ: usersList, postsList, studentsList)
      const itemsList = allRows.length > 0
        ? allRows.map((row) => {
            // Log tất cả các field từ row để linh hoạt với mọi resource
            return row
          })
        : undefined

      // Tạo object với dynamic key dựa trên resource name
      const logData: Record<string, unknown> = {
        resource: resourceName,
        action: "load-table",
        view: viewStatus,
        total: dataToLog.total,
        page: dataToLog.page,
      }
      
      // Thêm danh sách với tên field động (ví dụ: usersList, postsList, studentsList)
      if (itemsList) {
        logData[`${resourceName}List`] = itemsList
      }

      resourceLogger.tableAction(logData as Parameters<typeof resourceLogger.tableAction>[0])

      resourceLogger.dataStructure({
        resource: resourceName,
        dataType: "table",
        rowCount: dataToLog.rows.length,
        structure: {
          columns,
          pagination: {
            page: dataToLog.page,
            limit: dataToLog.limit,
            total: dataToLog.total,
            totalPages: dataToLog.totalPages,
          },
          sampleRows: allRows,
        },
      })

      return true
    },
    [resourceName, columns, getRowData]
  )

  // TẮT HOÀN TOÀN logger subscription
  // Logger chỉ log từ:
  // 1. useEffect đầu tiên (initial data và cached data)
  // 2. Khi refreshKey thay đổi (từ mutation thành công) - được handle trong data-table.tsx
  // KHÔNG log từ query cache subscription để tránh log khi:
  // - Chỉ mở dialog (không có mutation)
  // - Đang chờ API response (query invalidated nhưng chưa có data mới)
  // - Polling update (không có invalidation)

  // Track xem đã log chưa cho từng view+queryKey để tránh log lại khi component re-render
  const loggedKeysRef = useRef<Set<string>>(new Set())
  const lastQueryKeyStringRef = useRef<string | null>(null)

  useEffect(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    const viewId = currentViewId || "active"
    const viewChanged = lastViewIdRef.current !== viewId
    const isFirstMount = lastViewIdRef.current === undefined
    const queryKeyString = JSON.stringify(currentQueryKey)
    const queryKeyChanged = lastQueryKeyStringRef.current !== queryKeyString
    
    // Tạo unique key cho view+queryKey để track đã log chưa
    const logKey = `${viewId}:${queryKeyString}`
    const hasLogged = loggedKeysRef.current.has(logKey)

    // CHỈ log khi:
    // 1. Lần đầu mount (isFirstMount) VÀ chưa log cho key này
    // 2. View thay đổi (viewChanged) VÀ chưa log cho view mới
    // 3. Query key thay đổi cho cùng một view VÀ chưa log cho query key mới
    // KHÔNG log khi component re-render do state change khác (ví dụ: dialog mở)
    const shouldLog = !hasLogged && (isFirstMount || viewChanged || queryKeyChanged)

    if (!shouldLog) {
      // Update refs để track changes
      lastViewIdRef.current = viewId
      if (queryKeyChanged) {
        lastQueryKeyStringRef.current = queryKeyString
      }
      return
    }

    const cachedData = queryClient.getQueryData<DataTableResult<T>>(currentQueryKey)
    const dataToLog = cachedData || currentInitialData

    if (dataToLog) {
      const logged = logData(dataToLog, viewId, currentViewStatus)
      if (logged) {
        loggedKeysRef.current.add(logKey)
        lastViewIdRef.current = viewId
        lastQueryKeyStringRef.current = queryKeyString
      }
    } else if (viewChanged || isFirstMount) {
      let retryCount = 0
      const maxRetries = 20
      const retryInterval = 50

      const retryLog = () => {
        const retryCachedData = queryClient.getQueryData<DataTableResult<T>>(currentQueryKey)
        if (retryCachedData) {
          const logged = logData(retryCachedData, viewId, currentViewStatus)
          if (logged) {
            loggedKeysRef.current.add(logKey)
            lastViewIdRef.current = viewId
            lastQueryKeyStringRef.current = queryKeyString
            retryTimeoutRef.current = null
            return
          }
        }

        if (retryCount < maxRetries) {
          retryCount++
          retryTimeoutRef.current = setTimeout(retryLog, retryInterval)
        } else {
          retryTimeoutRef.current = null
        }
      }

      retryTimeoutRef.current = setTimeout(retryLog, retryInterval)
    } else {
      lastViewIdRef.current = viewId
      if (queryKeyChanged) {
        lastQueryKeyStringRef.current = queryKeyString
      }
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }
  }, [currentQueryKey, queryClient, currentInitialData, currentViewId, currentViewStatus, logData])

  // TẮT HOÀN TOÀN logger subscription
  // Logger chỉ log từ:
  // 1. useEffect đầu tiên (initial data và cached data)
  // 2. Khi refreshKey thay đổi (từ mutation thành công) - được handle trong data-table.tsx
  // KHÔNG log từ query cache subscription để tránh log khi:
  // - Chỉ mở dialog (không có mutation)
  // - Đang chờ API response (query invalidated nhưng chưa có data mới)
  // - Polling update (không có invalidation)
  //
  // useEffect(() => {
  //   // TẮT subscription để tránh log không cần thiết
  //   // Logger chỉ log từ initial data và sau khi mutation thành công (refreshKey change)
  // }, [])
}

