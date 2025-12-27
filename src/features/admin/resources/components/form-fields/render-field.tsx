"use client"

import { FieldContent, FieldError } from "@/components/ui/field"
import { TextField } from "./text-field"
import { TextareaField } from "./textarea-field"
import { NumberField } from "./number-field"
import { DateField } from "./date-field"
import { CheckboxField } from "./checkbox-field"
import { SwitchField } from "./switch-field"
import { SelectField } from "./select-field"
import { MultipleSelectField } from "./multiple-select-field"
import { PermissionsTableField } from "./permissions-table-field"
import { ImageField } from "./image-field"
import { AvatarField } from "./avatar-field"
import { EditorField } from "./editor-field"
import { SlugField } from "./slug-field"
import type { ResourceFormField } from "../resource-form"

interface RenderFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  sourceValue?: unknown
  readOnly?: boolean
}

export const renderFieldInput = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  sourceValue,
  readOnly = false,
}: RenderFieldProps<T>) => {
  const defaultValue = field.type === "multiple-select" || field.type === "permissions-table"
    ? (field.defaultValue ?? [])
    : (field.defaultValue ?? "")
  
  const fieldValue = value !== undefined && value !== null 
    ? value 
    : defaultValue

  if (field.render) {
    const customContent = field.render(field, fieldValue, onChange)
    return (
      <FieldContent>
        {customContent}
        {error && <FieldError>{error}</FieldError>}
      </FieldContent>
    )
  }

  switch (field.type) {
    case "textarea":
      return (
        <TextareaField
          field={field}
          value={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "select":
      return (
        <SelectField
          field={field}
          fieldValue={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "multiple-select":
      return (
        <MultipleSelectField
          field={field}
          fieldValue={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "permissions-table":
      return (
        <PermissionsTableField
          field={field}
          fieldValue={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending || readOnly}
          readOnly={readOnly || field.disabled}
        />
      )

    case "checkbox":
      return (
        <CheckboxField
          field={field}
          value={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "switch":
      return (
        <SwitchField
          field={field}
          value={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "number":
      return (
        <NumberField
          field={field}
          value={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "date":
      return (
        <DateField
          field={field}
          value={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )

    case "image":
      return (
        <ImageField
          value={fieldValue}
          onChange={onChange}
          placeholder={field.placeholder}
          error={error}
          disabled={field.disabled || isPending}
          readOnly={readOnly}
          fieldId={field.name as string}
        />
      )

    case "avatar":
      return (
        <AvatarField
          value={fieldValue}
          onChange={onChange}
          placeholder={field.placeholder}
          error={error}
          disabled={field.disabled || isPending}
          readOnly={readOnly}
          fieldId={field.name as string}
        />
      )

    case "editor":
      return (
        <EditorField
          value={fieldValue}
          onChange={onChange}
          error={error}
          disabled={field.disabled || isPending}
          readOnly={readOnly}
          className={field.className}
        />
      )

    case "slug":
      return (
        <SlugField
          field={field}
          value={fieldValue}
          onChange={onChange}
          error={error}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
          sourceValue={sourceValue}
        />
      )

    default:
      return (
        <TextField
          field={field}
          value={fieldValue}
          error={error}
          onChange={onChange}
          isPending={isPending}
          disabled={field.disabled}
          readOnly={readOnly}
        />
      )
  }
}

