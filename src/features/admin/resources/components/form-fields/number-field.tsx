"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ResourceFormField } from "../resource-form"

interface NumberFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export const NumberField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
}: NumberFieldProps<T>) => {
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
        type="number"
        value={String(fieldValue)}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={field.placeholder}
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

