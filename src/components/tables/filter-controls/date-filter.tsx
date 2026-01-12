/**
 * Date Filter Component
 */
"use client"

import { format } from "date-fns"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { DatePicker } from "@/components/ui/date-picker"
import type { ColumnFilterControlProps } from "./types"
import { apiClient } from "@/services/api/axios"

export function DateFilter<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    // Extract datesApiRoute để tránh dependency trên toàn bộ column.filter object
    const datesApiRoute = useMemo(() => {
        if (column.filter?.type === "date") {
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

