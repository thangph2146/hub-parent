"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import { DropdownItem } from "@/components/ui/dropdown-item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
  dateFrom?: Date
  dateTo?: Date
  onApply?: (dateFrom: Date | undefined, dateTo: Date | undefined) => void
  onClear?: () => void
  placeholder?: string
  label?: string
  applyLabel?: string
  clearLabel?: string
  className?: string
  align?: "start" | "center" | "end"
  variant?: "default" | "outline"
  datesWithItems?: string[]
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onApply,
  onClear,
  placeholder = "Pick a date",
  label,
  applyLabel = "Áp dụng",
  clearLabel = "Xóa",
  className,
  align = "start",
  variant = "outline",
  datesWithItems,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: dateFrom,
    to: dateTo,
  })
  const [isOpen, setIsOpen] = React.useState(false)

  // State for month/year navigation
  const [month, setMonth] = React.useState<Date>(() => dateFrom || new Date())

  // Sync with props
  React.useEffect(() => {
    const newDate = { from: dateFrom, to: dateTo }
    setDate(newDate)
    if (dateFrom) {
      setMonth(dateFrom)
    }
  }, [dateFrom, dateTo])

  const handleApply = () => {
    onApply?.(date?.from, date?.to)
    setIsOpen(false)
  }

  const handleClear = () => {
    setDate(undefined)
    onClear?.()
    setIsOpen(false)
  }

  // Month/Year navigation helpers
  const currentYear = month.getFullYear()
  const currentMonthIndex = month.getMonth()
  const years = Array.from({ length: 201 }, (_, i) => 1900 + i) // From 1900 to 2100
  const monthNames = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

  const handleYearChange = (value: string) => {
    const newDate = new Date(month)
    newDate.setFullYear(parseInt(value))
    setMonth(newDate)
  }

  const handleMonthChange = (value: string) => {
    const newDate = new Date(month)
    newDate.setMonth(parseInt(value))
    setMonth(newDate)
  }

  const handlePreviousMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() - 1)
    setMonth(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() + 1)
    setMonth(newDate)
  }

  // Calculate second month values
  const nextMonth = new Date(month)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthYear = nextMonth.getFullYear()
  const nextMonthIndex = nextMonth.getMonth()

  const handleNextMonthYearChange = (value: string) => {
    const newDate = new Date(month)
    newDate.setFullYear(parseInt(value))
    // We keep the same relative position, so the second month will have the new year
    // but its month index remains nextMonthIndex.
    // However, if we change the second month's year, it's simpler to just 
    // update the base month's year.
    setMonth(newDate)
  }

  const handleNextMonthChange = (value: string) => {
    const newDate = new Date(month)
    // If the second month should be 'value', then the first month should be 'value - 1'
    newDate.setMonth(parseInt(value) - 1)
    setMonth(newDate)
  }

  return (
    <Field className={cn("w-full", className)}>
      {label && <FieldLabel htmlFor="date-picker-range">{label}</FieldLabel>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker-range"
            variant={variant}
            className={cn(
              "w-full justify-start px-2.5 font-normal h-9",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y", { locale: vi })} -{" "}
                    {format(date.to, "LLL dd, y", { locale: vi })}
                  </>
                ) : (
                  format(date.from, "LLL dd, y", { locale: vi })
                )
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align} sideOffset={4}>
          <div className="flex flex-col">
            {/* Custom Month/Year Selectors for both months */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b">
              {/* Left Month Navigation */}
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-accent-foreground"
                  onClick={handlePreviousMonth}
                  aria-label="Tháng trước"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </Button>
                <div className="flex items-center justify-center gap-2 flex-1">
                  <DropdownItem
                    value={currentMonthIndex.toString()}
                    onValueChange={handleMonthChange}
                    options={monthNames.map((monthName, index) => ({
                      label: monthName,
                      value: index.toString(),
                    }))}
                    ariaLabel="Chọn tháng"
                  />
                  <span className="text-sm font-medium text-muted-foreground">/</span>
                  <DropdownItem
                    value={currentYear.toString()}
                    onValueChange={handleYearChange}
                    options={years.map((year) => ({
                      label: year.toString(),
                      value: year.toString(),
                    }))}
                    ariaLabel="Chọn năm"
                  />
                </div>
                <div className="w-7 sm:hidden" /> {/* Spacer for mobile to center dropdowns */}
              </div>

              {/* Right Month Navigation */}
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="w-7 sm:hidden" /> {/* Spacer for mobile to center dropdowns */}
                <div className="flex items-center justify-center gap-2 flex-1">
                  <DropdownItem
                    value={nextMonthIndex.toString()}
                    onValueChange={handleNextMonthChange}
                    options={monthNames.map((monthName, index) => ({
                      label: monthName,
                      value: index.toString(),
                    }))}
                    ariaLabel="Chọn tháng"
                  />
                  <span className="text-sm font-medium text-muted-foreground">/</span>
                  <DropdownItem
                    value={nextMonthYear.toString()}
                    onValueChange={handleNextMonthYearChange}
                    options={years.map((year) => ({
                      label: year.toString(),
                      value: year.toString(),
                    }))}
                    ariaLabel="Chọn năm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-accent-foreground"
                  onClick={handleNextMonth}
                  aria-label="Tháng sau"
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </Button>
              </div>
            </div>

            <Calendar
              initialFocus
              mode="range"
              month={month}
              onMonthChange={setMonth}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={vi}
              classNames={{
                month_caption: "hidden", // Hide default caption
                nav: "hidden", // Hide default navigation
              }}
              modifiers={
                datesWithItems && datesWithItems.length > 0
                  ? {
                      hasItems: datesWithItems.map((dateStr: string) => {
                        const [year, month, day] = dateStr.split("-").map(Number)
                        return new Date(year, month - 1, day)
                      }),
                    }
                  : undefined
              }
            />
          </div>
          <div className="flex items-center justify-end gap-2 border-t p-3">
            <Button variant="outline" size="sm" onClick={handleClear}>
              {clearLabel}
            </Button>
            <Button size="sm" onClick={handleApply}>
              {applyLabel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
