/**
 * Date Filter Component
 */
"use client"

import { format } from "date-fns"
import { useEffect, useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import type { ColumnFilterControlProps } from "./types"
import { apiClient } from "@/lib/api/axios"

export function DateFilter<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    const [datesWithItems, setDatesWithItems] = useState<string[]>([])

    // Fetch dates with items when component mounts
    useEffect(() => {
        const fetchDatesWithItems = async () => {
            try {
                // Only fetch if datesApiRoute is configured
                if (column.filter?.type === "date" && column.filter.datesApiRoute) {
                    const response = await apiClient.get<{ dates: string[] }>(
                        column.filter.datesApiRoute
                    )
                    if (response.data?.dates) {
                        setDatesWithItems(response.data.dates)
                    }
                }
            } catch {
                // Silently fail - dates highlighting is optional
            }
        }

        fetchDatesWithItems()
    }, [column.filter])

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
            datesWithItems={datesWithItems}
        />
    )
}

