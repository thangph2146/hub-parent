"use client"

import {
    Suspense,
    useMemo,
    useState,
} from "react"
import { Eye, EyeOff, Info } from "lucide-react"
import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { ColumnFilterControl } from "./filter-controls/column-filter-control"
import { useDataTableQuery } from "./hooks/use-data-table-query"
import { useDataTableSelection } from "./hooks/use-data-table-selection"
import { useDataTableLoader } from "./hooks/use-data-table-loader"
import { TableBodyContent } from "./components/table-body-content"
import { TableSummary } from "./components/table-summary"
import { TableBodySkeleton, SummarySkeleton } from "./components/table-skeletons"
import { SelectionCheckbox } from "./components/selection-checkbox"
import type { DataTableProps } from "./types"

const DEFAULT_LIMIT_OPTIONS = [10, 20, 50, 100]
const DEFAULT_EMPTY_MESSAGE = "Không có dữ liệu"

type UnknownRecord = Record<string, unknown>

export function DataTable<T extends object>({
    columns,
    loader,
    actions,
    className,
    initialFilters,
    initialPage = 1,
    initialLimit,
    limitOptions,
    emptyMessage = DEFAULT_EMPTY_MESSAGE,
    getRowId = (row) => {
        const id = (row as UnknownRecord).id
        return typeof id === "string" ? id : JSON.stringify(row)
    },
    refreshKey,
    fallbackRowCount = 5,
    initialData,
    selection,
    selectionActions,
    maxWidth,
    processingIds,
}: DataTableProps<T>) {
    const availableLimits = useMemo(() => {
        const base = limitOptions && limitOptions.length > 0 ? [...limitOptions] : [...DEFAULT_LIMIT_OPTIONS]
        const normalizedInitialLimit = initialLimit ?? base[0]
        if (!base.includes(normalizedInitialLimit)) {
            base.push(normalizedInitialLimit)
            base.sort((a, b) => a - b)
        }
        return base
    }, [limitOptions, initialLimit])

    const {
        query,
        pendingTextFilters,
        handleFilterChange,
        handleLimitChange,
        handlePageChange,
        handleResetFilters,
        showClearFilters,
    } = useDataTableQuery({
        initialPage,
        initialLimit,
        initialFilters,
        availableLimits,
    })

    const { dataPromise, isPending } = useDataTableLoader({
        loader,
        query,
        refreshKey,
        initialData,
    })

    const [visibleRows, setVisibleRows] = useState<T[]>([])
    const [showFilters, setShowFilters] = useState<boolean>(true)

    const {
        selectionEnabled,
        selectionDisabled,
        selectedIdsSet,
        handleRowToggle,
        handleToggleAll,
        clearSelection,
        selectedVisibleRows,
        allVisibleSelected,
        someVisibleSelected,
        selectableVisibleIds,
        isRowSelectable,
    } = useDataTableSelection({
        selection,
        visibleRows,
        getRowId,
    })

    const columnCount = useMemo(
        () => columns.length + (actions ? 1 : 0) + (selectionEnabled ? 1 : 0),
        [columns, actions, selectionEnabled],
    )

    return (
        <Flex
            direction="col"
            gap={4}
            className={cn("w-full", className)}
            style={
                maxWidth
                    ? {
                        maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
                    }
                    : undefined
            }
        >
            <Flex wrap={true} align="center" justify="between" gap={3} className="w-full">
                <Flex gap={3} align="center" justify="between" className="w-full sm:items-center">
                    <Flex align="center" gap={2}>
                        <TypographySpanSmallMuted className="whitespace-nowrap">Hiển thị</TypographySpanSmallMuted>
                        <Select
                            value={String(query.limit)}
                            onValueChange={(value) => handleLimitChange(Number(value))}
                            disabled={isPending}
                        >
                            <SelectTrigger
                                size="sm"
                                className="w-fit min-w-[80px]"
                                aria-label="Chọn số bản ghi mỗi trang"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableLimits.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Flex>
                    <Flex align="end" justify="end" gap={2} wrap={true} className="sm:gap-2">
                        {columns.some((col) => col.filter) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters((prev) => !prev)}
                                disabled={isPending}
                                aria-label={showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                                className="px-2 sm:px-3"
                            >
                                {showFilters ? (
                                    <>
                                        <IconSize size="md" className="sm:mr-2">
                                          <EyeOff />
                                        </IconSize>
                                        <span className="inline">Ẩn bộ lọc</span>
                                    </>
                                ) : (
                                    <>
                                        <IconSize size="md" className="sm:mr-2">
                                          <Eye />
                                        </IconSize>
                                        <span className="inline">Hiện bộ lọc</span>
                                    </>
                                )}
                            </Button>
                        )}
                        {showClearFilters && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                disabled={isPending}
                                className="px-2 sm:px-3"
                            >
                                <span className="inline">Xóa bộ lọc</span>
                            </Button>
                        )}
                    </Flex>
                </Flex>
            </Flex>

            {selectionEnabled && selectionActions && selectedIdsSet.size > 0 ? (
                <div className="w-full rounded-lg border border-border/80 bg-muted/40 p-2 sm:p-3">
                    {selectionActions({
                        selectedIds: Array.from(selectedIdsSet),
                        selectedRows: selectedVisibleRows,
                        clearSelection,
                    })}
                </div>
            ) : null}

            <div className="rounded-md border overflow-x-auto relative w-full">
                <div className="min-w-full inline-block">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow className="bg-primary">
                                {selectionEnabled ? (
                                    <TableHead className="w-10 max-w-10 min-w-10 align-middle px-2 sticky left-0 z-10 bg-primary text-primary-foreground border-r border-border">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help flex items-center justify-center">
                                                    <SelectionCheckbox
                                                        checked={allVisibleSelected}
                                                        indeterminate={someVisibleSelected}
                                                        disabled={selectionDisabled || selectableVisibleIds.length === 0}
                                                        onCheckedChange={(checked) => handleToggleAll(selectableVisibleIds, checked)}
                                                    />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="max-w-[250px]">
                                                <p className="text-sm">Chọn/bỏ chọn tất cả các dòng hiển thị</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableHead>
                                ) : null}
                                {columns.map((column) => (
                                    <TableHead
                                        key={`header-${column.accessorKey}`}
                                        className={cn("align-middle whitespace-nowrap px-2 sm:px-3 bg-primary text-primary-foreground", column.headerClassName)}
                                    >
                                        <span>{column.header}</span>
                                    </TableHead>
                                ))}
                                {actions ? (
                                    <TableHead className="min-w-[120px] max-w-[120px] text-center px-2 sm:px-3 sticky right-0 z-10 bg-secondary text-primary-foreground border-l border-border">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Flex align="center" justify="center" gap={1.5} className="cursor-help">
                                                    <span>Hành động</span>
                                                    <IconSize size="sm" className="text-primary-foreground">
                                                        <Info />
                                                    </IconSize>
                                                </Flex>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" className="max-w-[250px]">
                                                <p className="text-sm">Các thao tác có thể thực hiện với dòng này (xem, sửa, xóa, v.v.)</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableHead>
                                ) : null}
                            </TableRow>
                            {columns.some((col) => col.filter) && showFilters && (
                                <TableRow className="border-t border-border bg-muted/80">
                                    {selectionEnabled ? <TableHead className="w-10 max-w-10 min-w-10 bg-muted px-1 sm:px-3 sticky left-0 z-10 border-r border-border" /> : null}
                                    {columns.map((column) => (
                                        <TableHead
                                            key={`filter-${column.accessorKey}`}
                                            className={cn("min-w-[100px] align-middle bg-muted/80 whitespace-nowrap px-2 sm:px-3", column.headerClassName)}
                                        >
                                            <ColumnFilterControl
                                                column={column}
                                                value={pendingTextFilters[column.accessorKey] ?? ""}
                                                disabled={isPending}
                                                onChange={(value, immediate) => handleFilterChange(column.accessorKey, value, immediate)}
                                            />
                                        </TableHead>
                                    ))}
                                    {actions ? <TableHead className="min-w-[120px] bg-muted text-center px-2 sm:px-3 sticky right-0 z-10 border-l border-border" /> : null}
                                </TableRow>
                            )}
                        </TableHeader>
                        <Suspense fallback={<TableBodySkeleton columnCount={columnCount} rowCount={fallbackRowCount} />}>
                            <TableBodyContent<T>
                                dataPromise={dataPromise}
                                columns={columns}
                                actions={actions}
                                showSelection={selectionEnabled}
                                selectionDisabled={selectionDisabled}
                                selectedIds={selectedIdsSet}
                                isRowSelectable={isRowSelectable}
                                onToggleRow={handleRowToggle}
                                getRowId={getRowId}
                                onVisibleRowsChange={setVisibleRows}
                                emptyMessage={emptyMessage}
                                totalColumns={columnCount}
                                processingIds={processingIds}
                                isPending={isPending}
                            />
                        </Suspense>
                    </Table>
                </div>
            </div>

            <Suspense fallback={<SummarySkeleton />}>
                <TableSummary
                    dataPromise={dataPromise}
                    isPending={isPending}
                    onPageChange={handlePageChange}
                />
            </Suspense>
        </Flex>
    )
}
