/**
 * Date Range Filter Component
 */
"use client"

import { format } from "date-fns"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { ColumnFilterControlProps } from "./types"
import { apiClient } from "@/services/api/axios"

export function DateRangeFilter<T extends object = object>({
    column,
    value,
    disabled: _disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    // Extract datesApiRoute để tránh dependency trên toàn bộ column.filter object
    const datesApiRoute = useMemo(() => {
        if (column.filter?.type === "date-range") {
            return column.filter.datesApiRoute
        }
        return undefined
    }, [column.filter])

    // Sử dụng React Query để cache dates với items
    // Cache trong 5 phút để giảm số lần refetch không cần thiết
    const { data: datesData } = useQuery<{ dates: string[] }>({
        queryKey: ["dates-with-items", datesApiRoute],
        queryFn: async () => {
            if (!datesApiRoute) return { dates: [] }
            const response = await apiClient.get<{ dates: string[] }>(datesApiRoute)
            return response.data || { dates: [] }
        },
        enabled: !!datesApiRoute,
        staleTime: 5 * 60 * 1000, // 5 phút - dates không thay đổi thường xuyên
        gcTime: 10 * 60 * 1000, // 10 phút
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })

    const datesWithItems = datesData?.dates || []

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

