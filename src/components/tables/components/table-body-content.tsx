import { use, useEffect, useMemo, useState, type ReactNode } from "react"
import { cn } from "@/utils"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { SelectionCheckbox } from "./selection-checkbox"
import type { DataTableColumn, DataTableResult } from "../types"

export interface TableBodyContentProps<T extends object> {
    dataPromise: Promise<DataTableResult<T>>
    columns: DataTableColumn<T>[]
    actions?: (row: T) => ReactNode
    showSelection: boolean
    selectionDisabled: boolean
    selectedIds: Set<string>
    isRowSelectable: (row: T) => boolean
    onToggleRow: (row: T, rowId: string, checked: boolean) => void
    getRowId: (row: T, index: number) => string
    onVisibleRowsChange?: (rows: T[]) => void
    emptyMessage: string
    totalColumns: number
    processingIds?: Set<string> | string[]
    isPending?: boolean
}

type UnknownRecord = Record<string, unknown>

export function TableBodyContent<T extends object>({
    dataPromise,
    columns,
    actions,
    showSelection,
    selectionDisabled,
    selectedIds,
    isRowSelectable,
    onToggleRow,
    getRowId,
    onVisibleRowsChange,
    emptyMessage,
    totalColumns,
    processingIds,
    isPending,
}: TableBodyContentProps<T>) {
    const result = use(dataPromise)
    
    const processingIdsSet = useMemo(() => {
        if (!processingIds) return new Set<string>()
        return processingIds instanceof Set ? processingIds : new Set(processingIds)
    }, [processingIds])

    const [persistedProcessingIdsSet, setPersistedProcessingIdsSet] = useState<Set<string>>(processingIdsSet)
    
    if (!isPending && persistedProcessingIdsSet !== processingIdsSet) {
        setPersistedProcessingIdsSet(processingIdsSet)
    }

    const effectiveProcessingIdsSet = useMemo(() => {
        if (!isPending) return processingIdsSet
        const combined = new Set(processingIdsSet)
        persistedProcessingIdsSet.forEach(id => combined.add(id))
        return combined
    }, [processingIdsSet, persistedProcessingIdsSet, isPending])
    
    const rows = useMemo(() => {
        if (!result?.rows || !Array.isArray(result.rows)) {
            return []
        }
        return result.rows
    }, [result])
    
    useEffect(() => {
        onVisibleRowsChange?.(rows)
    }, [rows, onVisibleRowsChange])

    if (!rows.length) {
        return (
            <TableBody>
                <TableRow>
                    <TableCell colSpan={totalColumns} className="py-10 text-center text-muted-foreground">
                        {emptyMessage}
                    </TableCell>
                </TableRow>
            </TableBody>
        )
    }

    return (
        <TableBody>
            {rows.map((row, index) => {
                const rowId = getRowId(row, index)
                const rowSelectable = isRowSelectable(row)
                const rowSelected = selectedIds.has(rowId)
                const isProcessing = effectiveProcessingIdsSet.has(rowId)

                if (isProcessing) {
                    return (
                        <TableRow key={rowId} className="animate-pulse bg-muted/10">
                            {showSelection ? (
                                <TableCell className="w-10 max-w-10 min-w-10 align-middle px-2 sticky left-0 z-10 bg-muted border-r border-border">
                                    <Skeleton className="h-4 w-4 mx-auto" />
                                </TableCell>
                            ) : null}
                            {columns.map((column) => (
                                <TableCell
                                    key={`${rowId}-${column.accessorKey}`}
                                    className={cn("px-2 sm:px-3", column.className)}
                                >
                                    <Skeleton className="h-5 w-full" />
                                </TableCell>
                            ))}
                            {actions ? (
                                <TableCell className="w-[120px] min-w-[120px] max-w-[120px] px-2 sm:px-3 sticky right-0 z-10 bg-muted border-l border-border">
                                    <Skeleton className="h-8 w-full" />
                                </TableCell>
                            ) : null}
                        </TableRow>
                    )
                }

                return (
                    <TableRow key={rowId} className="group" data-state={rowSelected ? "selected" : undefined}>
                        {showSelection ? (
                            <TableCell className="w-10 max-w-10 min-w-10 align-middle px-2 sticky left-0 z-10 bg-muted text-secondary-foreground group-data-[state=selected]:bg-secondary/10 border-r border-border">
                                <SelectionCheckbox
                                    checked={rowSelected}
                                    indeterminate={false}
                                    disabled={selectionDisabled || !rowSelectable}
                                    onCheckedChange={(checked) => onToggleRow(row, rowId, checked)}
                                />
                            </TableCell>
                        ) : null}
                        {columns.map((column) => {
                            const rawValue = (row as UnknownRecord)[column.accessorKey]
                            const hasCustomWidth = column.className?.includes("max-w-") || column.className?.includes("min-w-")
                            return (
                                <TableCell key={column.accessorKey} className={cn("px-2 sm:px-3 break-words", !hasCustomWidth && "max-w-[300px]", column.className)}>
                                    {column.cell
                                        ? column.cell(row)
                                        : rawValue == null
                                            ? "-"
                                            : typeof rawValue === "string" || typeof rawValue === "number"
                                                ? rawValue
                                                : Array.isArray(rawValue)
                                                    ? rawValue.join(", ")
                                                    : JSON.stringify(rawValue)}
                                </TableCell>
                            )
                        })}
                        {actions ? <TableCell className="min-w-[100px] text-center whitespace-nowrap px-2 sm:px-3 sticky right-0 z-10 bg-muted border-l border-border">{actions(row)}</TableCell> : null}
                    </TableRow>
                )
            })}
        </TableBody>
    )
}
