/**
 * Text Field Component
 */

"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { ResourceFormField } from "../resource-form"

interface TextFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
}

export function TextField<T>({
  field,
  value,
  error,
  onChange,
  isPending = false,
}: TextFieldProps<T>) {
  const fieldValue = value ?? ""

  return (
    <FieldContent>
      <Input
        id={field.name as string}
        name={field.name as string}
        type={field.type ?? "text"}
        value={String(fieldValue)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled || isPending}
        aria-invalid={error ? "true" : "false"}
        className={error ? "border-destructive" : ""}
      />
      {error && <FieldError>{error}</FieldError>}
    </FieldContent>
  )
}

