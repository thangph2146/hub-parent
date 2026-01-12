"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import { useClientOnly } from "@/hooks"
import { logger } from "@/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { apiClient } from "@/services/api/axios"

export const PostDateRange = () => {
  const isMounted = useClientOnly()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [datesWithItems, setDatesWithItems] = useState<string[]>([])
  
  const dateFromParam = searchParams?.get("dateFrom")
  const dateToParam = searchParams?.get("dateTo")

  // Fetch dates with posts when component mounts
  useEffect(() => {
    const fetchDatesWithItems = async () => {
      try {
        const response = await apiClient.get<{ dates: string[] }>(
          "/post/dates-with-posts"
        )
        if (response.data?.dates) {
          setDatesWithItems(response.data.dates)
          logger.debug("PostDateRange: Fetched dates with posts", {
            action: "fetch_dates_with_posts",
            datesCount: response.data.dates.length,
          })
        }
      } catch (error) {
        // Silently fail - dates highlighting is optional
        logger.debug("PostDateRange: Failed to fetch dates with posts", {
          action: "fetch_dates_error",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    fetchDatesWithItems()
  }, [])
  
  // Derive dates from URL params using useMemo
  const dateFrom = useMemo(() => {
    if (dateFromParam) {
      const date = new Date(dateFromParam)
      return isNaN(date.getTime()) ? undefined : date
    }
    return undefined
  }, [dateFromParam])
  
  const dateTo = useMemo(() => {
    if (dateToParam) {
      const date = new Date(dateToParam)
      return isNaN(date.getTime()) ? undefined : date
    }
    return undefined
  }, [dateToParam])

  const handleApply = (from: Date | undefined, to: Date | undefined) => {
    logger.info("PostDateRange: Áp dụng khoảng thời gian", {
      action: "apply_date_range",
      dateFrom: from ? format(from, "dd/MM/yyyy", { locale: vi }) : undefined,
      dateTo: to ? format(to, "dd/MM/yyyy", { locale: vi }) : undefined,
      dateFromISO: from?.toISOString().split("T")[0],
      dateToISO: to?.toISOString().split("T")[0],
      previousDateFrom: dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
      previousDateTo: dateTo ? format(dateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
    })
    
    const params = new URLSearchParams(searchParams?.toString() || "")
    
    if (from) {
      params.set("dateFrom", from.toISOString().split("T")[0])
    } else {
      params.delete("dateFrom")
    }
    
    if (to) {
      params.set("dateTo", to.toISOString().split("T")[0])
    } else {
      params.delete("dateTo")
    }
    
    params.delete("page") // Reset to page 1 when changing date range
    
    const newUrl = `/bai-viet?${params.toString()}`
    logger.debug("PostDateRange: Chuyển hướng với URL mới", {
      action: "navigate_with_date_range",
      url: newUrl,
      params: params.toString(),
    })
    
    router.push(newUrl)
  }

  const handleClear = () => {
    logger.info("PostDateRange: Xóa khoảng thời gian", {
      action: "clear_date_range",
      previousDateFrom: dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
      previousDateTo: dateTo ? format(dateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
    })
    
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.delete("dateFrom")
    params.delete("dateTo")
    params.delete("page")
    
    const newUrl = `/bai-viet?${params.toString()}`
    logger.debug("PostDateRange: Chuyển hướng sau khi xóa", {
      action: "navigate_after_clear",
      url: newUrl,
      params: params.toString(),
    })
    
    router.push(newUrl)
  }

  if (!isMounted) {
    return (
      <Button variant="outline" className="opacity-50 cursor-not-allowed h-9 sm:h-10 px-3 sm:px-4">
        <IconSize size="sm">
          <Calendar className="mr-2 h-4 w-4" />
        </IconSize>
        <span className="hidden sm:inline">Chọn khoảng thời gian</span>
        <span className="sm:hidden">Thời gian</span>
      </Button>
    )
  }

  return (
    <DateRangePicker
      dateFrom={dateFrom}
      dateTo={dateTo}
      onApply={handleApply}
      onClear={handleClear}
      placeholder="Chọn khoảng thời gian"
      align="end"
      datesWithItems={datesWithItems}
    />
  )
}

