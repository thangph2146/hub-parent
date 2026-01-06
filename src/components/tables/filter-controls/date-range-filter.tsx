/**
 * Date Range Filter Component
 */
"use client"

import { format } from "date-fns"
import { useEffect, useState } from "react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { ColumnFilterControlProps } from "./types"
import { apiClient } from "@/lib/api/axios"

export function DateRangeFilter<T extends object = object>({
    column,
    value,
    disabled: _disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    const [datesWithItems, setDatesWithItems] = useState<string[]>([])

    // Fetch dates with items when component mounts
    useEffect(() => {
        const fetchDatesWithItems = async () => {
            try {
                // Only fetch if datesApiRoute is configured
                if (column.filter?.type === "date-range" && column.filter.datesApiRoute) {
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

    if (column.filter?.type !== "date-range") return null

    // Parse value: format is "fromDate|toDate", "fromDate|", "|toDate", or empty string
    let dateFrom: Date | undefined
    let dateTo: Date | undefined
    
    if (value && value.trim()) {
        const parts = value.split("|")
        try {
            // Handle "fromDate|toDate" or "fromDate|" or "|toDate"
            if (parts.length >= 1 && parts[0]?.trim()) {
                const from = parts[0].trim()
                const parsedFrom = new Date(from)
                if (!isNaN(parsedFrom.getTime())) {
                    dateFrom = parsedFrom
                }
            }
            
            if (parts.length >= 2 && parts[1]?.trim()) {
                const to = parts[1].trim()
                const parsedTo = new Date(to)
                if (!isNaN(parsedTo.getTime())) {
                    dateTo = parsedTo
                }
            }
        } catch {
            // Invalid format, ignore
        }
    }

    const handleDateFromChange = (_date: Date | undefined) => {
        // Chỉ update internal state trong DateRangePicker, không apply filter
        // Filter chỉ được apply khi user nhấn "Áp dụng" trong handleApply
        // Không gọi onChange ở đây để tránh apply filter tự động
    }

    const handleDateToChange = (_date: Date | undefined) => {
        // Chỉ update internal state trong DateRangePicker, không apply filter
        // Filter chỉ được apply khi user nhấn "Áp dụng" trong handleApply
        // Không gọi onChange ở đây để tránh apply filter tự động
    }

    const handleApply = (from: Date | undefined, to: Date | undefined) => {
        const fromStr = from ? format(from, "yyyy-MM-dd") : ""
        const toStr = to ? format(to, "yyyy-MM-dd") : ""
        // Format: "fromDate|toDate" or "fromDate|" or "|toDate" or ""
        const newValue = fromStr || toStr ? `${fromStr}|${toStr}` : ""
        onChange(newValue, true)
    }

    const handleClear = () => {
        onChange("", true)
    }

    return (
        <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={handleDateFromChange}
            onDateToChange={handleDateToChange}
            onApply={handleApply}
            onClear={handleClear}
            placeholder={column.filter.placeholder ?? "Chọn khoảng thời gian"}
            fromLabel={column.filter.fromLabel ?? "Từ ngày"}
            toLabel={column.filter.toLabel ?? "Đến ngày"}
            applyLabel={column.filter.applyLabel ?? "Áp dụng"}
            clearLabel={column.filter.clearLabel ?? "Xóa"}
            datesWithItems={datesWithItems}
        />
    )
}

