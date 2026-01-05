/**
 * Main Column Filter Control Component
 * Routes to appropriate filter component based on type
 */
"use client"

import { TextFilter } from "./text-filter"
import { SelectFilter } from "./select-filter"
import { MultiSelectFilter } from "./multi-select-filter"
import { DateFilter } from "./date-filter"
import { DateRangeFilter } from "./date-range-filter"
import type { ColumnFilterControlProps } from "./types"

export function ColumnFilterControl<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    if (!column.filter) return null

    // Route to appropriate filter component based on type
    switch (column.filter.type) {
        case "select":
            return <SelectFilter column={column} value={value} disabled={disabled} onChange={onChange} />
        case "multi-select":
            return <MultiSelectFilter column={column} value={value} disabled={disabled} onChange={onChange} />
        case "date":
            return <DateFilter column={column} value={value} disabled={disabled} onChange={onChange} />
        case "date-range":
            return <DateRangeFilter column={column} value={value} disabled={disabled} onChange={onChange} />
        case "text":
        default:
            return <TextFilter column={column} value={value} disabled={disabled} onChange={onChange} />
    }
}

