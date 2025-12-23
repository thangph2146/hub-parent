/**
 * Text Filter Component
 */
"use client"

import { Input } from "@/components/ui/input"
import type { ColumnFilterControlProps } from "./types"

export function TextFilter<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    return (
        <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={column.filter?.placeholder ?? `Lọc ${column.header.toLowerCase()}...`}
            className="h-7 sm:h-8"
            disabled={disabled}
        />
    )
}

