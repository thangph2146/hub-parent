"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { SelectCombobox } from "./customs/select-combobox"
import type { ResourceFormField } from "../resource-form"

interface SelectFieldProps<T> {
  field: ResourceFormField<T> 
  fieldValue: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
}
export const SelectField = <T,>({
  field,
  fieldValue,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
}: SelectFieldProps<T>) => {
  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <FieldContent>
      <SelectCombobox
        field={field}
        fieldValue={fieldValue}
        error={error}
        onChange={onChange}
        isPending={isPending}
        disabled={disabled}
        readOnly={readOnly}
        fieldId={fieldId}
        errorId={errorId}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

