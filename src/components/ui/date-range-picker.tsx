"use client"

import { useMemo, useState, useEffect } from "react"
import { Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { logger } from "@/lib/config/logger"
import { Field, FieldLabel, FieldContent } from "@/components/ui/field"

export interface DateRangePickerProps {
  dateFrom?: Date
  dateTo?: Date
  onDateFromChange?: (date: Date | undefined) => void
  onDateToChange?: (date: Date | undefined) => void
  onApply?: (dateFrom: Date | undefined, dateTo: Date | undefined) => void
  onClear?: () => void
  placeholder?: string
  fromLabel?: string
  toLabel?: string
  applyLabel?: string
  clearLabel?: string
  className?: string
  align?: "start" | "center" | "end"
  variant?: "default" | "outline"
  datesWithItems?: string[] // Array of date strings in format "yyyy-MM-dd" to highlight
}

export const DateRangePicker = ({
  dateFrom: controlledDateFrom,
  dateTo: controlledDateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
  placeholder = "Chọn khoảng thời gian",
  fromLabel = "Từ ngày",
  toLabel = "Đến ngày",
  applyLabel = "Áp dụng",
  clearLabel = "Xóa",
  className,
  align = "start",
  variant = "outline",
  datesWithItems,
}: DateRangePickerProps) => {
  // Maintain internal state for user interactions (always update on user input)
  const [internalDateFrom, setInternalDateFrom] = useState<Date | undefined>(
    controlledDateFrom
  )
  const [internalDateTo, setInternalDateTo] = useState<Date | undefined>(
    controlledDateTo
  )
  const [open, setOpen] = useState(false)
  // Track if user has interacted to prioritize internal state
  const [hasInteracted, setHasInteracted] = useState(false)
  // Track screen size for responsive layout
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth > 640 : false
  )

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth > 640)
    }

    if (typeof window !== "undefined") {
      handleResize() // Set initial value
      window.addEventListener("resize", handleResize)
      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])

  // Derive current values: prioritize internal state if user has interacted, otherwise use controlled props
  const dateFrom = useMemo(() => {
    if (hasInteracted) {
      return internalDateFrom
    }
    return controlledDateFrom !== undefined ? controlledDateFrom : internalDateFrom
  }, [controlledDateFrom, internalDateFrom, hasInteracted])
  
  const dateTo = useMemo(() => {
    if (hasInteracted) {
      return internalDateTo
    }
    return controlledDateTo !== undefined ? controlledDateTo : internalDateTo
  }, [controlledDateTo, internalDateTo, hasInteracted])

  const hasActiveFilter = dateFrom || dateTo

  const handleDateFromChange = (date: Date | undefined) => {
    // Always update internal state for user interactions
    logger.debug("DateRangePicker: Chọn ngày bắt đầu", {
      action: "date_from_selected",
      date: date ? format(date, "dd/MM/yyyy", { locale: vi }) : undefined,
      timestamp: date?.toISOString(),
      previousDate: internalDateFrom ? format(internalDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
    })
    setInternalDateFrom(date)
    setHasInteracted(true)
    onDateFromChange?.(date)
  }

  const handleDateToChange = (date: Date | undefined) => {
    // Always update internal state for user interactions
    logger.debug("DateRangePicker: Chọn ngày kết thúc", {
      action: "date_to_selected",
      date: date ? format(date, "dd/MM/yyyy", { locale: vi }) : undefined,
      timestamp: date?.toISOString(),
      previousDate: internalDateTo ? format(internalDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
    })
    setInternalDateTo(date)
    setHasInteracted(true)
    onDateToChange?.(date)
  }

  const handleApply = () => {
    // Always use internal state when user has interacted (internal state reflects user's current selection)
    // Only fall back to controlled props if internal state is undefined
    const finalDateFrom = internalDateFrom !== undefined ? internalDateFrom : controlledDateFrom
    const finalDateTo = internalDateTo !== undefined ? internalDateTo : controlledDateTo
    
    logger.info("DateRangePicker: Áp dụng khoảng thời gian", {
      action: "date_range_applied",
      dateFrom: finalDateFrom ? format(finalDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
      dateTo: finalDateTo ? format(finalDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
      dateFromTimestamp: finalDateFrom?.toISOString(),
      dateToTimestamp: finalDateTo?.toISOString(),
      hasInteracted,
      usedInternalState: {
        from: internalDateFrom !== undefined,
        to: internalDateTo !== undefined,
      },
    })
    
    onApply?.(finalDateFrom, finalDateTo)
    setHasInteracted(false) // Reset interaction flag after apply
    setOpen(false)
  }

  const handleClear = () => {
    logger.info("DateRangePicker: Xóa khoảng thời gian", {
      action: "date_range_cleared",
      previousDateFrom: internalDateFrom ? format(internalDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
      previousDateTo: internalDateTo ? format(internalDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
    })
    
    setInternalDateFrom(undefined)
    setInternalDateTo(undefined)
    setHasInteracted(false) // Reset interaction flag after clear
    onDateFromChange?.(undefined)
    onDateToChange?.(undefined)
    onClear?.()
    setOpen(false)
  }
  
  // Reset interaction flag when popover closes without applying
  const handleOpenChange = (newOpen: boolean) => {
    logger.debug("DateRangePicker: Thay đổi trạng thái popover", {
      action: newOpen ? "popover_opened" : "popover_closed",
      hasInteracted,
      controlledDateFrom: controlledDateFrom ? format(controlledDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
      controlledDateTo: controlledDateTo ? format(controlledDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
      internalDateFrom: internalDateFrom ? format(internalDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
      internalDateTo: internalDateTo ? format(internalDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
    })
    
    setOpen(newOpen)
    if (newOpen) {
      // When opening, reset interaction flag and sync with controlled props
      logger.debug("DateRangePicker: Reset và sync với controlled props khi mở", {
        action: "sync_on_open",
        controlledDateFrom: controlledDateFrom ? format(controlledDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
        controlledDateTo: controlledDateTo ? format(controlledDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
      })
      setHasInteracted(false)
      setInternalDateFrom(controlledDateFrom)
      setInternalDateTo(controlledDateTo)
    } else if (!hasInteracted) {
      // Reset to controlled props when closing without interaction
      logger.debug("DateRangePicker: Reset về controlled props khi đóng (không có interaction)", {
        action: "reset_on_close",
        controlledDateFrom: controlledDateFrom ? format(controlledDateFrom, "dd/MM/yyyy", { locale: vi }) : undefined,
        controlledDateTo: controlledDateTo ? format(controlledDateTo, "dd/MM/yyyy", { locale: vi }) : undefined,
      })
      setInternalDateFrom(controlledDateFrom)
      setInternalDateTo(controlledDateTo)
    }
  }

  const displayText = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const dateFormat = isMobile ? "dd/MM" : "dd/MM/yyyy";

    if (dateFrom && dateTo) {
      return `${format(dateFrom, dateFormat, { locale: vi })} - ${format(dateTo, dateFormat, { locale: vi })}`
    }
    if (dateFrom) {
      return `${isMobile ? "Từ" : "Từ ngày"} ${format(dateFrom, dateFormat, { locale: vi })}`
    }
    if (dateTo) {
      return `${isMobile ? "Đến" : "Đến ngày"} ${format(dateTo, dateFormat, { locale: vi })}`
    }
    return isMobile ? "Thời gian" : placeholder
  }, [dateFrom, dateTo, placeholder])

  const buttonVariant = hasActiveFilter ? "default" : variant

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant={buttonVariant}
          className={cn(
            "justify-start text-left font-normal",
            !hasActiveFilter && "text-muted-foreground",
            className
          )}
        >
          <Flex align="center" gap={2}>
            <IconSize size="sm">
              <Calendar />
            </IconSize>
            <span className="truncate">{displayText}</span>
          </Flex>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 min-w-[280px] sm:min-w-[320px]" 
        align={align}
      >
        <Flex 
          direction="col"
          gap={0}
          width="full"
        >
          {/* Date Pickers Section */}
          <div className="p-4 sm:p-5">
            <Flex 
              gap={3}
              width="full"
              direction={isSmallScreen ? "row" : "col"}
            >
              <Field
                orientation="vertical"
                className="flex-1 min-w-0"
                style={{ 
                  width: isSmallScreen ? "auto" : "100%",
                }}
              >
                <FieldLabel className="text-sm font-medium mb-2">
                  {fromLabel}
                </FieldLabel>
                <FieldContent>
                  <DatePicker
                    date={dateFrom}
                    onDateChange={handleDateFromChange}
                    placeholder="Chọn ngày bắt đầu"
                    className="w-full"
                    autoClose={false}
                    datesWithItems={datesWithItems}
                  />
                </FieldContent>
              </Field>
              <Field
                orientation="vertical"
                className="flex-1 min-w-0"
                style={{ 
                  width: isSmallScreen ? "auto" : "100%",
                }}
              >
                <FieldLabel className="text-sm font-medium mb-2">
                  {toLabel}
                </FieldLabel>
                <FieldContent>
                  <DatePicker
                    date={dateTo}
                    onDateChange={handleDateToChange}
                    placeholder="Chọn ngày kết thúc"
                    className="w-full"
                    autoClose={false}
                    datesWithItems={datesWithItems}
                  />
                </FieldContent>
              </Field>
            </Flex>
          </div>
          
          {/* Action Buttons Section */}
          <div className="px-4 sm:px-5 py-3 border-t bg-muted/30">
            <Flex 
              align="center" 
              justify="end"
              gap={2}
              width="full"
            >
              {hasActiveFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial sm:min-w-[90px]"
                >
                  <Flex align="center" gap={1.5}>
                    <IconSize size="sm">
                      <X />
                    </IconSize>
                    <span>{clearLabel}</span>
                  </Flex>
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1 sm:flex-initial sm:min-w-[90px]"
              >
                {applyLabel}
              </Button>
            </Flex>
          </div>
        </Flex>
      </PopoverContent>
    </Popover>
  )
}

