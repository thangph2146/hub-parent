import { use, useEffect, useMemo, useState, type ReactNode, useCallback, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/utils"
import { TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { SelectionCheckbox } from "./selection-checkbox"
import { Button } from "@/components/ui/button"
import { IconSize } from "@/components/ui/typography"
import type { DataTableColumn, DataTableResult, DataTableTreeConfig } from "../types"

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
    tree?: DataTableTreeConfig<T>
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
    tree,
}: TableBodyContentProps<T>) {
    const result = use(dataPromise)
    
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        if (tree?.defaultExpanded && result?.rows) {
            return new Set(result.rows.map((row, index) => getRowId(row, index)))
        }
        return new Set()
    })

    // Update expandedIds when result changes and defaultExpanded is true
    // Pattern: Adjusting state when props change during render
    const [prevResult, setPrevResult] = useState(result)
    if (result !== prevResult) {
        setPrevResult(result)
        if (tree?.defaultExpanded && result?.rows) {
            const allIds = result.rows.map((row, index) => getRowId(row, index))
            setExpandedIds(new Set(allIds))
        }
    }

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

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
    
    const treeData = useMemo(() => {
        if (!result?.rows || !Array.isArray(result.rows)) {
            return { rows: [], depthMap: new Map(), idToIndexMap: new Map(), rowMap: new Map() }
        }
        
        const allRows = result.rows
        if (!tree) return { rows: allRows, depthMap: new Map(), idToIndexMap: new Map(), rowMap: new Map() }

        const { parentIdKey = "parentId" as keyof T & string } = tree

        // Build maps for quick lookup and hierarchical logic
        const rowMap = new Map<string, T>()
        const childrenMap = new Map<string | null, T[]>()
        const idToIndexMap = new Map<T, number>()
        
        allRows.forEach((row, index) => {
            const id = getRowId(row, index)
            rowMap.set(id, row)
            idToIndexMap.set(row, index)
            
            const pId = (row as UnknownRecord)[parentIdKey] as string | null || null
            if (!childrenMap.has(pId)) {
                childrenMap.set(pId, [])
            }
            childrenMap.get(pId)!.push(row)
        })

        // Hierarchical sorting: parents must come before children
        const hierarchicalRows: T[] = []
        const addedIds = new Set<string>()

        const buildHierarchicalList = (parentId: string | null = null) => {
            const children = childrenMap.get(parentId) || []
            // Children already maintain original order because they were pushed in allRows order
            children.forEach((child) => {
                const childId = getRowId(child, idToIndexMap.get(child)!)
                if (!addedIds.has(childId)) {
                    hierarchicalRows.push(child)
                    addedIds.add(childId)
                    buildHierarchicalList(childId)
                }
            })
        }

        buildHierarchicalList(null)

        // Add orphans (rows whose parent is not in the list)
        allRows.forEach((row, index) => {
            const id = getRowId(row, index)
            if (!addedIds.has(id)) {
                hierarchicalRows.push(row)
                addedIds.add(id)
                
                const addOrphanChildren = (pId: string) => {
                    const children = childrenMap.get(pId) || []
                    children.forEach(c => {
                        const cId = getRowId(c, idToIndexMap.get(c)!)
                        if (!addedIds.has(cId)) {
                            hierarchicalRows.push(c)
                            addedIds.add(cId)
                            addOrphanChildren(cId)
                        }
                    })
                }
                addOrphanChildren(id)
            }
        })

        // Pre-calculate depths and children status for better performance
        const depthMap = new Map<string, number>()
        const hasChildrenMap = new Map<string, boolean>()

        const calculateDepth = (row: T, id: string): number => {
            if (depthMap.has(id)) return depthMap.get(id)!
            
            const pId = (row as UnknownRecord)[parentIdKey] as string | null
            if (!pId || !rowMap.has(pId)) {
                depthMap.set(id, 0)
                return 0
            }
            
            const depth = 1 + calculateDepth(rowMap.get(pId)!, pId)
            depthMap.set(id, depth)
            return depth
        }

        hierarchicalRows.forEach(row => {
            const id = getRowId(row, idToIndexMap.get(row)!)
            calculateDepth(row, id)
            
            // Check if this row is a parent to anyone in allRows
            const hasChildren = allRows.some(r => (r as UnknownRecord)[parentIdKey] === id)
            hasChildrenMap.set(id, hasChildren)
        })

        const filteredRows = hierarchicalRows.filter((row) => {
            let currentParentId = (row as UnknownRecord)[parentIdKey] as string | null
            
            // If it's a root row or an orphan whose parent isn't in our map, it's visible at the top level
            if (!currentParentId || !rowMap.has(currentParentId)) return true

            // Check if any ancestor is collapsed
            while (currentParentId) {
                if (!expandedIds.has(currentParentId)) {
                    return false
                }
                const parentRow = rowMap.get(currentParentId)
                if (!parentRow) break
                currentParentId = (parentRow as UnknownRecord)[parentIdKey] as string | null
            }
            
            return true
        })

        return {
            rows: filteredRows,
            depthMap,
            hasChildrenMap,
            idToIndexMap,
        }
    }, [result, tree, expandedIds, getRowId])

    const { rows, depthMap, hasChildrenMap, idToIndexMap } = treeData
    
    const lastOnVisibleRowsChangeRef = useRef<((rows: T[]) => void) | undefined>(onVisibleRowsChange)
    const lastRowsRef = useRef<T[]>([])

    useEffect(() => {
        lastOnVisibleRowsChangeRef.current = onVisibleRowsChange
    }, [onVisibleRowsChange])

    useEffect(() => {
        // Only trigger if rows array reference changed
        if (rows !== lastRowsRef.current) {
            lastRowsRef.current = rows
            onVisibleRowsChange?.(rows)
        }
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
            {rows.map((row) => {
                const rowId = getRowId(row, idToIndexMap.get(row)!)
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
                        {columns.map((column, colIndex) => {
                            const rawValue = (row as UnknownRecord)[column.accessorKey]
                            const hasCustomWidth = column.className?.includes("max-w-") || column.className?.includes("min-w-")
                            
                            // Tree structure logic
                            let content = column.cell
                                ? column.cell(row)
                                : rawValue == null
                                    ? "-"
                                    : typeof rawValue === "string" || typeof rawValue === "number"
                                        ? rawValue
                                        : Array.isArray(rawValue)
                                            ? rawValue.join(", ")
                                            : JSON.stringify(rawValue)

                            if (tree && colIndex === 0) {
                                const { 
                                    indentSize = 24 
                                } = tree

                                const depth = depthMap.get(rowId) || 0
                                const hasChildren = hasChildrenMap?.get(rowId) ?? false
                                const isExpanded = expandedIds.has(rowId)

                                content = (
                                    <div 
                                        className="flex items-center gap-1 relative group/tree" 
                                        style={{ paddingLeft: `${depth * indentSize}px` }}
                                    >
                                        {depth > 0 && Array.from({ length: depth }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="absolute top-0 bottom-0 w-px bg-border/40 left-0" 
                                                style={{ left: `${(i * indentSize) + (indentSize / 2)}px` }}
                                            />
                                        ))}
                                        {depth > 0 && (
                                            <div 
                                                className="absolute h-px bg-border/40 top-1/2 -translate-y-1/2"
                                                style={{ 
                                                    left: `${((depth - 1) * indentSize) + (indentSize / 2)}px`,
                                                    width: `${indentSize / 2}px`
                                                }}
                                            />
                                        )}
                                        {hasChildren ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-6 w-6 p-0 shrink-0 z-10",
                                                    "bg-background border border-border/50",
                                                    "hover:bg-accent hover:text-accent-foreground",
                                                    "hover:border-accent-foreground/20",
                                                    "group-hover/tree:bg-accent/30",
                                                    "shadow-sm transition-all duration-200"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleExpand(rowId)
                                                }}
                                            >
                                                <IconSize size="sm" className={cn(
                                                    "text-muted-foreground transition-transform duration-200",
                                                    isExpanded ? "rotate-0" : "-rotate-90"
                                                )}>
                                                    <ChevronDown />
                                                </IconSize>
                                            </Button>
                                        ) : (
                                            <div className="w-6 shrink-0 flex items-center justify-center z-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-border/60" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 py-1">
                                            {content}
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <TableCell key={column.accessorKey} className={cn("px-2 sm:px-3 break-words", !hasCustomWidth && "max-w-[300px]", column.className)}>
                                    {content}
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
