"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { TypographyP } from "@/components/ui/typography"
import type { ResourceFormField } from "../resource-form"
import { Flex } from "@/components/ui/flex"

interface CheckboxFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
}

export const CheckboxField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
}: CheckboxFieldProps<T>) => {
  const fieldValue = value ?? false
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <FieldContent>
      <Flex align="center" gap={2}>
        <input
          type="checkbox"
          id={fieldId}
          name={fieldId}
          checked={Boolean(fieldValue)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={field.disabled || isPending}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
          className={cn(
            "h-5 w-5 rounded border border-input",
            error && "border-destructive"
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

