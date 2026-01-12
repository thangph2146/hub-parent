"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/utils"
import { TypographyP } from "@/components/ui/typography"
import type { ResourceFormField } from "../resource-form"
import { Flex } from "@/components/ui/flex"

interface CheckboxFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export const CheckboxField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
}: CheckboxFieldProps<T>) => {
  const fieldValue = value ?? false
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled || field.disabled || isPending
  const isReadOnly = readOnly && !isDisabled

  return (
    <FieldContent>
      <Flex align="center" gap={2}>
        <Checkbox
          id={fieldId}
          checked={Boolean(fieldValue)}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={isDisabled || isReadOnly}
          data-readonly={isReadOnly ? "true" : undefined}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
          className={cn(
            error && "border-destructive",
            isReadOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
            isDisabled && !isReadOnly && "!opacity-100"
          )}
        />
        <Label htmlFor={fieldId} asChild>
          <TypographyP>{field.label}</TypographyP>
        </Label>
      </Flex>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

