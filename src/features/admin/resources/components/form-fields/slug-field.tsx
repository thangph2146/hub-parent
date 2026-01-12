"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { generateSlug } from "@/utils/generate-slug"
import { cn } from "@/utils"
import type { ResourceFormField } from "../resource-form"

interface SlugFieldProps<T> {
  field: ResourceFormField<T>
  value: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  disabled?: boolean
  readOnly?: boolean
  sourceValue?: unknown 
}

export const SlugField = <T,>({
  field,
  value,
  error,
  onChange,
  isPending = false,
  disabled = false,
  readOnly = false,
  sourceValue,
}: SlugFieldProps<T>) => {
  const fieldValue = typeof value === "string" ? value : ""
  const [slugValue, setSlugValue] = useState<string>(fieldValue)
  const slugManuallyEditedRef = useRef<boolean>(false)
  const previousSourceValueRef = useRef<string | null>(null)
  const isInitialMountRef = useRef<boolean>(true)
  const onChangeRef = useRef(onChange)
  const fieldValueRef = useRef(fieldValue)
  const sourceValueRef = useRef(typeof sourceValue === "string" ? sourceValue : "")

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    fieldValueRef.current = fieldValue
    if (fieldValue !== slugValue && !slugManuallyEditedRef.current) {
      setSlugValue(fieldValue)
      if (fieldValue) {
        slugManuallyEditedRef.current = false
      }
    }
  }, [fieldValue, slugValue])

  const processSourceChange = useCallback(() => {
    const sourceStr = sourceValueRef.current
    
    if (isInitialMountRef.current) {
      previousSourceValueRef.current = sourceStr || null
      isInitialMountRef.current = false
      if (!slugValue && sourceStr.trim()) {
        const generatedSlug = generateSlug(sourceStr)
        if (generatedSlug) {
          setSlugValue(generatedSlug)
          onChangeRef.current(generatedSlug)
        }
      }
      return
    }
    
    if (
      !slugManuallyEditedRef.current &&
      sourceStr.trim() &&
      sourceStr !== previousSourceValueRef.current
    ) {
      const generatedSlug = generateSlug(sourceStr)
      if (generatedSlug && generatedSlug !== slugValue) {
        setSlugValue(generatedSlug)
        onChangeRef.current(generatedSlug)
      }
      previousSourceValueRef.current = sourceStr
    } else if (sourceStr !== previousSourceValueRef.current) {
      previousSourceValueRef.current = sourceStr || null
    }
  }, [slugValue])

  useEffect(() => {
    const sourceStr = typeof sourceValue === "string" ? sourceValue : ""
    sourceValueRef.current = sourceStr
    processSourceChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue !== slugValue) {
      slugManuallyEditedRef.current = true
    }
    setSlugValue(newValue)
    onChange(newValue)
  }

  const fieldId = field.name as string
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled || field.disabled || isPending
  const isReadOnly = readOnly && !isDisabled

  return (
    <FieldContent>
      <Input
        id={fieldId}
        name={fieldId}
        type="text"
        value={slugValue}
        onChange={handleChange}
        placeholder={field.placeholder}
        required={field.required}
        disabled={isDisabled && !isReadOnly}
        readOnly={isReadOnly}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={errorId || field.description ? `${fieldId}-description` : undefined}
        className={cn(
          error && "border-destructive",
          isReadOnly && "!opacity-100 disabled:!opacity-100 [&:read-only]:!opacity-100 cursor-default bg-muted/50 border-muted-foreground/20",
          isDisabled && !isReadOnly && "!opacity-100"
        )}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </FieldContent>
  )
}

