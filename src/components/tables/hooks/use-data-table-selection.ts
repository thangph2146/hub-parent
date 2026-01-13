import { useState, useCallback, useMemo } from "react"
import type { DataTableSelectionConfig } from "../types"

export interface UseDataTableSelectionOptions<T extends object> {
    selection?: DataTableSelectionConfig<T>
    visibleRows: T[]
    getRowId: (row: T, index: number) => string
}

export function useDataTableSelection<T extends object>({
    selection,
    visibleRows,
    getRowId,
}: UseDataTableSelectionOptions<T>) {
    const selectionEnabled = Boolean(selection?.enabled)
    const selectionDisabled = Boolean(selection?.disabled)
    const isRowSelectable = useMemo(
        () => selection?.isRowSelectable ?? (() => true),
        [selection?.isRowSelectable],
    )

    const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
        () => new Set(selection?.defaultSelectedIds ?? []),
    )

    // Sync from prop during render instead of effect
    const [prevSelectedIdsProp, setPrevSelectedIdsProp] = useState<string[] | undefined>(selection?.selectedIds)
    if (selection?.selectedIds !== prevSelectedIdsProp) {
        setPrevSelectedIdsProp(selection?.selectedIds)
        if (selection?.selectedIds) {
            setInternalSelectedIds(new Set(selection.selectedIds))
        }
    }

    const selectedIdsSet = useMemo(
        () => (selection?.selectedIds ? new Set(selection.selectedIds) : internalSelectedIds),
        [selection, internalSelectedIds],
    )

    const commitSelection = useCallback(
        (mutator: (draft: Set<string>) => void) => {
            if (!selectionEnabled) return
            const base = selection?.selectedIds ? new Set(selection.selectedIds) : new Set(internalSelectedIds)
            mutator(base)
            const next = new Set(base)
            if (!selection?.selectedIds) {
                setInternalSelectedIds(next)
            }
            if (selection?.onSelectionChange) {
                const rowsArray = Array.isArray(visibleRows) ? visibleRows : []
                const rows = rowsArray
                    .map((row, index) => ({ row, id: getRowId(row, index) }))
                    .filter(({ id }) => next.has(id))
                    .map(({ row }) => row)
                selection.onSelectionChange({
                    ids: Array.from(next),
                    rows,
                })
            }
        },
        [selectionEnabled, selection, internalSelectedIds, visibleRows, getRowId],
    )

    const handleRowToggle = useCallback(
        (row: T, rowId: string, checked: boolean) => {
            if (!selectionEnabled || selectionDisabled) return
            commitSelection((draft) => {
                if (checked) {
                    draft.add(rowId)
                } else {
                    draft.delete(rowId)
                }
            })
        },
        [selectionEnabled, selectionDisabled, commitSelection],
    )

    const handleToggleAll = useCallback(
        (rowIds: string[], checked: boolean) => {
            if (!selectionEnabled || selectionDisabled) return
            if (rowIds.length === 0) return
            commitSelection((draft) => {
                rowIds.forEach((id) => {
                    if (checked) {
                        draft.add(id)
                    } else {
                        draft.delete(id)
                    }
                })
            })
        },
        [selectionEnabled, selectionDisabled, commitSelection],
    )

    const clearSelection = useCallback(() => {
        if (!selectionEnabled || selectionDisabled) return
        commitSelection((draft) => {
            draft.clear()
        })
    }, [selectionEnabled, selectionDisabled, commitSelection])

    const visibleRowMeta = useMemo(() => {
        const rows = Array.isArray(visibleRows) ? visibleRows : []
        return rows.map((row, index) => {
            const id = getRowId(row, index)
            return {
                id,
                row,
                selectable: selectionEnabled && !selectionDisabled && isRowSelectable(row),
            }
        })
    }, [visibleRows, getRowId, selectionEnabled, selectionDisabled, isRowSelectable])

    const selectableVisibleIds = useMemo(
        () => visibleRowMeta.filter((meta) => meta.selectable).map((meta) => meta.id),
        [visibleRowMeta],
    )

    const selectedVisibleRows = useMemo(
        () => visibleRowMeta.filter((meta) => selectedIdsSet.has(meta.id)).map((meta) => meta.row),
        [visibleRowMeta, selectedIdsSet],
    )

    const allVisibleSelected =
        selectableVisibleIds.length > 0 && selectableVisibleIds.every((id) => selectedIdsSet.has(id))
    const someVisibleSelected =
        selectableVisibleIds.length > 0 &&
        selectableVisibleIds.some((id) => selectedIdsSet.has(id)) &&
        !allVisibleSelected

    return {
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
    }
}
