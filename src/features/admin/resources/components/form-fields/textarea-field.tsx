"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { ResourceFormField } from "../resource-form"

interface TextareaFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export const TextareaField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
}: TextareaFieldProps<T>) => {
  const fieldValue = value ?? ""
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled || field.disabled || isPending
  const isReadOnly = readOnly && !isDisabled

  return (
    <FieldContent>
      <Textarea
        id={fieldId}
        name={fieldId}
        value={String(fieldValue)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        disabled={isDisabled && !isReadOnly}
        readOnly={isReadOnly}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
        className={cn(
          isReadOnly && "!opacity-100 disabled:!opacity-100 [&:read-only]:!opacity-100 cursor-default",
          error && "border-destructive"
        )}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

