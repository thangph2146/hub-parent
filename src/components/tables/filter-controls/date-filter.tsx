/**
 * Date Filter Component
 */
"use client"

import { format } from "date-fns"
import { DatePicker } from "@/components/ui/date-picker"
import type { ColumnFilterControlProps } from "./types"

export function DateFilter<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    if (column.filter?.type !== "date") return null

    let dateValue: Date | undefined
    try {
        if (value && value.trim()) {
            const parsed = new Date(value)
            if (!isNaN(parsed.getTime())) {
                dateValue = parsed
            }
        }
    } catch {
        dateValue = undefined
    }

    const dateFormat = column.filter.dateFormat
    const enableTime = column.filter.enableTime ?? false
    const showSeconds = column.filter.showSeconds ?? false

    const defaultDateFormat = enableTime
        ? showSeconds
            ? "dd/MM/yyyy HH:mm:ss"
            : "dd/MM/yyyy HH:mm"
        : "dd/MM/yyyy"

    const getOutputFormat = () => {
        if (enableTime) {
            return showSeconds ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd'T'HH:mm"
        }
        return "yyyy-MM-dd"
    }

    return (
        <DatePicker
            date={dateValue}
            onDateChange={(date) => {
                if (date) {
                    onChange(format(date, getOutputFormat()), true)
                } else {
                    onChange("", true)
                }
            }}
            placeholder={column.filter.placeholder ?? (enableTime ? "Chọn ngày giờ" : "Chọn ngày")}
            dateFormat={dateFormat ?? defaultDateFormat}
            disabled={disabled}
            enableTime={enableTime}
            showSeconds={showSeconds}
        />
    )
}

