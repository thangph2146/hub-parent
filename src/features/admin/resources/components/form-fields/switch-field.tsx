"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import type { ResourceFormField } from "../resource-form"
import { cn } from "@/lib/utils"

interface SwitchFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export const SwitchField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
}: SwitchFieldProps<T>) => {
  const fieldValue = value ?? false
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled || field.disabled || isPending
  const isReadOnly = readOnly && !isDisabled

  return (
    <FieldContent>
      <Switch
        id={fieldId}
        checked={Boolean(fieldValue)}
        onCheckedChange={(checked) => onChange(checked)}
        disabled={isDisabled || isReadOnly}
        data-readonly={isReadOnly ? "true" : undefined}
        aria-invalid={error ? "true" : "false"}
        aria-label={field.label}
        aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
        className={cn(
          isReadOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
          isDisabled && !isReadOnly && "!opacity-100"
        )}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

