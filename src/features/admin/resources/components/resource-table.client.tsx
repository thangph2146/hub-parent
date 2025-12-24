"use client"

import { useCallback, useState, useEffect, useMemo, useRef } from "react"
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { Flex } from "@/components/ui/flex"
import { TypographyH4, TypographySpanSmall, IconSize } from "@/components/ui/typography"
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
  const [refreshKey, setRefreshKey] = useState(0)
  const lastViewIdRef = useRef<string | undefined>(currentViewId)
  const [hasViewChanged, setHasViewChanged] = useState(false)

  const activeView =
    viewModes.find((view) => view.id === currentViewId) ?? viewModes[0]

  const columns = activeView.columns ?? baseColumns
  const emptyMessage = activeView.emptyMessage

  const lastRefreshKeyRef = useRef(0)
  const lastRefreshTimeRef = useRef(0)
  
  const debouncedRefresh = useDebouncedCallback(
    () => {
      const now = Date.now()
      if (now - lastRefreshTimeRef.current < 200) return
      lastRefreshTimeRef.current = now
      setRefreshKey((prev) => {
        const next = prev + 1
        if (prev !== next && lastRefreshKeyRef.current !== next) {
          lastRefreshKeyRef.current = next
        }
        return next
      })
    },
    200
  )
  
  const handleRefresh = useCallback(() => {
    debouncedRefresh()
  }, [debouncedRefresh])

  const onRefreshReadyRef = useRef(onRefreshReady)
  const exposedRefs = useRef<Set<string>>(new Set())
  useEffect(() => {
    onRefreshReadyRef.current = onRefreshReady
  }, [onRefreshReady])

  useEffect(() => {
    const instanceId = `refresh-${handleRefresh.toString().slice(0, 20)}`
    if (exposedRefs.current.has(instanceId)) return
    exposedRefs.current.add(instanceId)
    onRefreshReadyRef.current?.(handleRefresh)
  }, [handleRefresh])

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

  const initialData = useMemo(() => {
    if (hasViewChanged) return undefined
    return initialDataByView?.[activeView.id]
  }, [hasViewChanged, initialDataByView, activeView.id])

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
      <Flex align="center" gap={2} wrap={true}>
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
    <Flex direction="col" gap={4}>
      {(title || viewModeButtons) && (
        <Flex direction="col" align="start" justify="between" gap={2} className="w-full sm:flex-row sm:items-center">
          {title ? (
            <TypographyH4 className="truncate">{title}</TypographyH4>
          ) : (
            <Flex />
          )}
          {viewModeButtons && (
            <Flex align="center" gap={2} wrap={true} className="w-full sm:w-auto sm:justify-end">
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
