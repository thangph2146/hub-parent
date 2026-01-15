import type { ReactNode } from "react"
import type { ColumnFilterConfig } from "./filter-controls/types"

export interface DataTableColumn<T extends object> {
    accessorKey: keyof T & string
    header: string
    cell?: (row: T) => ReactNode
    filter?: ColumnFilterConfig
    className?: string
    headerClassName?: string
}

export interface DataTableQueryState {
    page: number
    limit: number
    search: string
    filters: Record<string, string>
}

export interface DataTableResult<T extends object> {
    rows: T[]
    page: number
    limit: number
    total: number
    totalPages: number
}

export type DataTableLoader<T extends object> = (
    query: DataTableQueryState,
) => Promise<DataTableResult<T>>

export interface DataTableSelectionChange<T> {
    ids: string[]
    rows: T[]
}

export interface DataTableSelectionConfig<T extends object> {
    enabled: boolean
    selectedIds?: string[]
    defaultSelectedIds?: string[]
    onSelectionChange?: (change: DataTableSelectionChange<T>) => void
    isRowSelectable?: (row: T) => boolean
    disabled?: boolean
}

export interface DataTableTreeConfig<T extends object> {
    parentIdKey?: keyof T & string
    idKey?: keyof T & string
    childrenCountKey?: string // Key to check if row has children without loading them all
    indentSize?: number
    defaultExpanded?: boolean
}

export interface DataTableProps<T extends object> {
    columns: DataTableColumn<T>[]
    loader: DataTableLoader<T>
    actions?: (row: T) => ReactNode
    className?: string
    initialFilters?: Record<string, string>
    initialPage?: number
    initialLimit?: number
    limitOptions?: number[]
    emptyMessage?: string
    getRowId?: (row: T, index: number) => string
    refreshKey?: number | string
    fallbackRowCount?: number
    initialData?: DataTableResult<T>
    selection?: DataTableSelectionConfig<T>
    selectionActions?: (context: {
        selectedIds: string[]
        selectedRows: T[]
        clearSelection: () => void
    }) => ReactNode
    maxHeight?: string | number
    enableHorizontalScroll?: boolean
    maxWidth?: string | number
    processingIds?: Set<string> | string[]
    tree?: DataTableTreeConfig<T>
}
