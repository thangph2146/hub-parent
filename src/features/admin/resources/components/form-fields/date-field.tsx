"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/utils"
import type { ResourceFormField } from "../resource-form"

interface DateFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export const DateField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
}: DateFieldProps<T>) => {
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled || field.disabled || isPending
  const isReadOnly = readOnly && !isDisabled

  // Convert value to Date object
  const dateValue = (() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    if (typeof value === "string") {
      const date = new Date(value)
      return isNaN(date.getTime()) ? undefined : date
    }
    return undefined
  })()

  // Check if field name suggests it needs time (e.g., publishedAt, expiresAt)
  const enableTime = field.name?.toString().toLowerCase().includes("at") || false

  const handleDateChange = (date: Date | undefined) => {
    if (isReadOnly || isDisabled) return
    
    if (date) {
      // Convert Date to ISO string
      onChange(date.toISOString())
    } else {
      onChange(null)
    }
  }

  return (
    <FieldContent>
      <div
        id={fieldId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
        className={cn(
          isReadOnly && "pointer-events-none opacity-50"
        )}
      >
        <DatePicker
          date={dateValue}
          onDateChange={handleDateChange}
          placeholder={field.placeholder || "Chọn ngày"}
          disabled={isDisabled || isReadOnly}
          enableTime={enableTime}
          className={cn(
            error && "border-destructive",
            isReadOnly && "cursor-default"
          )}
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

