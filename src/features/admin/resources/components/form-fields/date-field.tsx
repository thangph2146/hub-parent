"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
  const fieldValue = value ?? ""
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled || field.disabled || isPending
  const isReadOnly = readOnly && !isDisabled

  return (
    <FieldContent>
      <Input
        id={fieldId}
        name={fieldId}
        type="date"
        value={fieldValue ? String(fieldValue).split("T")[0] : ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        disabled={isDisabled && !isReadOnly}
        readOnly={isReadOnly}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
        className={cn(
          error && "border-destructive",
          isReadOnly && "!opacity-100 disabled:!opacity-100 [&:read-only]:!opacity-100 cursor-default"
        )}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

