"use client"

import { useCallback, useState, useEffect, useMemo, useRef } from "react"
import { flushSync } from "react-dom"
import {
  DataTable,
  type DataTableColumn,
  type DataTableLoader,
  type DataTableQueryState,
  type DataTableResult,
  type DataTableSelectionChange,
} from "@/components/tables"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Flex } from "@/components/ui/flex"
import { TypographyH2, TypographySpanSmall, IconSize } from "@/components/ui/typography"
import { logger } from "@/lib/config/logger"
import type {
  ResourceTableLoader,
  ResourceViewMode,
  ResourceSelectionContext,
  ResourceRowActionContext,
} from "@/features/admin/resources/types"

export interface ResourceTableClientProps<T extends object> {
  title?: string
  baseColumns: DataTableColumn<T>[]
  loader: ResourceTableLoader<T>
  viewModes: ResourceViewMode<T>[]
  defaultViewId?: string
  initialDataByView?: Record<string, DataTableResult<T>>
  limitOptions?: number[]
  fallbackRowCount?: number
  headerActions?: React.ReactNode
  onRefreshReady?: (refresh: () => void) => void
  onViewChange?: (viewId: string) => void
}

export const ResourceTableClient = <T extends object>({
  title,
  baseColumns,
  loader,
  viewModes,
  defaultViewId,
  initialDataByView,
  limitOptions,
  fallbackRowCount = 5,
  headerActions,
  onRefreshReady,
  onViewChange,
}: ResourceTableClientProps<T>) => {
  if (viewModes.length === 0) {
    throw new Error("ResourceTableClient requires at least one view mode")
  }

  const isMobile = useIsMobile()
  const [currentViewId, setCurrentViewId] = useState(defaultViewId ?? viewModes[0].id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const refreshCounterRef = useRef(0)
  // Khởi tạo refreshKey với giá trị stable (0) để tránh hydration mismatch
  // refreshKey sẽ chỉ được update sau khi component mount trên client thông qua handleRefresh
  const [refreshKey, setRefreshKey] = useState<string | number>(0)
  const lastViewIdRef = useRef<string | undefined>(currentViewId)
  const [hasViewChanged, setHasViewChanged] = useState(false)

  const activeView =
    viewModes.find((view) => view.id === currentViewId) ?? viewModes[0]

  const columns = activeView.columns ?? baseColumns
  const emptyMessage = activeView.emptyMessage

  // Update refreshKey ngay lập tức để trigger re-render của DataTable
  // Sử dụng counter + timestamp + random để đảm bảo refreshKey luôn thay đổi và unique
  // Điều này đảm bảo DataTable sẽ luôn detect được sự thay đổi và trigger refetch
  // Sử dụng queueMicrotask để defer flushSync ra khỏi lifecycle method, tránh React warning
  const handleRefresh = useCallback(() => {
    refreshCounterRef.current += 1
    
    // Tạo refreshKey mới với timestamp, counter và random để đảm bảo luôn unique
    // Sử dụng Date.now() + performance.now() + counter + random để đảm bảo giá trị luôn khác nhau
    const timestamp = Date.now()
    const performanceTime = performance.now()
    const random = Math.random()
    const currentCounter = refreshCounterRef.current
    const newRefreshKey = `${timestamp}-${performanceTime}-${currentCounter}-${random}`
    
    // Sử dụng queueMicrotask để defer flushSync ra khỏi lifecycle method
    // Điều này tránh React warning về việc gọi flushSync trong lifecycle method
    // queueMicrotask đảm bảo code chạy sau khi current execution context hoàn thành
    queueMicrotask(() => {
      flushSync(() => {
        setRefreshKey((prev) => {
          // Luôn return giá trị mới để đảm bảo React detect được thay đổi
          // Nếu prev === newRefreshKey (rất hiếm), thêm random để đảm bảo luôn khác
          const finalKey = prev === newRefreshKey ? `${newRefreshKey}-${Math.random()}` : newRefreshKey
          
          logger.debug("ResourceTable refreshKey updated", {
            previousKey: prev,
            newKey: finalKey,
            counter: currentCounter,
            timestamp,
            performanceTime,
            random,
          })
          
          return finalKey
        })
      })
    })
  }, [])

  const onRefreshReadyRef = useRef(onRefreshReady)
  useEffect(() => {
    onRefreshReadyRef.current = onRefreshReady
  }, [onRefreshReady])

  // Đăng ký handleRefresh với onRefreshReady ngay khi component mount
  // Đảm bảo refresh callback luôn được đăng ký trước khi mutations hoàn thành
  // Gọi lại mỗi khi onRefreshReady hoặc handleRefresh thay đổi
  // Sử dụng useLayoutEffect để đảm bảo đăng ký trước khi mutations có thể hoàn thành
  useEffect(() => {
    if (onRefreshReadyRef.current) {
      logger.debug("Registering handleRefresh with onRefreshReady", {
        hasOnRefreshReady: !!onRefreshReadyRef.current,
        hasHandleRefresh: !!handleRefresh,
      })
      onRefreshReadyRef.current(handleRefresh)
    } else {
      logger.warn("onRefreshReady is not available yet", {
        hasOnRefreshReady: !!onRefreshReadyRef.current,
      })
    }
  }, [handleRefresh, onRefreshReady])

  const handleViewChange = useCallback(
    (viewId: string) => {
      if (viewId === currentViewId) return
      lastViewIdRef.current = currentViewId
      setCurrentViewId(viewId)
      setSelectedIds([])
      setHasViewChanged(true)
      handleRefresh()
      onViewChange?.(viewId)
    },
    [currentViewId, handleRefresh, onViewChange],
  )
  
  useEffect(() => {
    if (hasViewChanged) {
      const timeoutId = setTimeout(() => {
        setHasViewChanged(false)
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [hasViewChanged, currentViewId])

  useEffect(() => {
    onViewChange?.(currentViewId)
  }, [currentViewId, onViewChange])

  const dataLoader: DataTableLoader<T> = useCallback(
    (query: DataTableQueryState) => loader(query, activeView),
    [loader, activeView],
  )

  const selectionConfig = activeView.selectionEnabled
    ? {
        enabled: true,
        selectedIds,
        onSelectionChange: (change: DataTableSelectionChange<T>) => {
          setSelectedIds(change.ids)
        },
      }
    : undefined

  const selectionActions =
    activeView.selectionEnabled && activeView.selectionActions
      ? (context: { selectedIds: string[]; selectedRows: T[]; clearSelection: () => void }) =>
          activeView.selectionActions?.({
            view: activeView,
            selectedIds: context.selectedIds,
            selectedRows: context.selectedRows,
            clearSelection: context.clearSelection,
            refresh: handleRefresh,
          } satisfies ResourceSelectionContext<T>)
      : undefined

  const rowActions = activeView.rowActions
    ? (row: T) =>
        activeView.rowActions?.(row, {
          view: activeView,
          refresh: handleRefresh,
        } satisfies ResourceRowActionContext<T>)
    : undefined

  // Không clear initialData khi chuyển view để tránh mất data
  // DataTable sẽ tự động fetch data mới khi refreshKey thay đổi hoặc query thay đổi
  // Giữ lại initialData của view hiện tại nếu có, hoặc undefined nếu không có
  const initialData = useMemo(() => {
    return initialDataByView?.[activeView.id]
  }, [initialDataByView, activeView.id])

  const viewModeButtons = useMemo(() => {
    const hasViewModes = viewModes.length > 1
    const hasHeaderActions = !!headerActions

    if (!hasViewModes && !hasHeaderActions) return null

    // Chỉ có headerActions, không có view modes
    if (!hasViewModes && hasHeaderActions) {
      return headerActions
    }

    // Có view modes - gắn headerActions vào viewModeSection
    const viewModeSection = (
      <Flex align="center" gap={2} wrap>
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-3 min-w-[100px] max-w-[180px] justify-between"
              >
                <TypographySpanSmall className="truncate">
                  {viewModes.find((v) => v.id === currentViewId)?.label ?? viewModes[0].label}
                </TypographySpanSmall>
                <IconSize size="sm">
                  <ChevronDown />
                </IconSize>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {viewModes.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  className={currentViewId === view.id ? "bg-accent/10" : ""}
                >
                  {view.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            {viewModes.map((view) => (
              <Button
                key={view.id}
                type="button"
                size="sm"
                variant={currentViewId === view.id ? "default" : "outline"}
                onClick={() => handleViewChange(view.id)}
                className="whitespace-nowrap"
              >
                {view.label}
              </Button>
            ))}
          </>
        )}
        {hasHeaderActions && headerActions}
      </Flex>
    )

    return viewModeSection
  }, [viewModes, currentViewId, isMobile, handleViewChange, headerActions])

  return (
    <Flex direction="col" gap={4} fullWidth>
      {(title || viewModeButtons) && (
        <Flex direction="col" align="start" justify="between" gap={2} fullWidth className="sm:flex-row sm:items-center">
          {title && <TypographyH2 className="truncate font-bold tracking-tight">{title}</TypographyH2>}
          {viewModeButtons && (
            <Flex align="center" justify="end" gap={2} wrap fullWidth className="sm:w-auto sm:justify-end">
              {viewModeButtons}
            </Flex>
          )}
        </Flex>
      )}

      <DataTable<T>
        columns={columns}
        loader={dataLoader}
        limitOptions={limitOptions}
        emptyMessage={emptyMessage}
        selection={selectionConfig}
        selectionActions={selectionActions}
        actions={rowActions}
        fallbackRowCount={fallbackRowCount}
        refreshKey={refreshKey}
        initialData={initialData}
      />
    </Flex>
  )
}
