/**
 * Client Component: Resource Form
 * 
 * Generic form component hỗ trợ page, dialog, và sheet variants
 * Pattern: Server Component → Client Component (UI/interactions)
 */

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ArrowLeft, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { renderFieldInput } from "./form-fields"

export interface ResourceFormField<T = unknown> {
  name: keyof T | string
  label: string
  description?: string
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "multiple-select" | "checkbox" | "switch" | "date"
  placeholder?: string
  required?: boolean
  disabled?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string | number }>
  optionGroups?: Array<{ label: string; options: Array<{ label: string; value: string | number }> }>
  icon?: React.ReactNode
  render?: (field: ResourceFormField<T>, value: unknown, onChange: (value: unknown) => void) => React.ReactNode
  validate?: (value: unknown) => { valid: boolean; error?: string }
}

export interface ResourceFormProps<T extends Record<string, unknown>> {
  // Data
  data: T | null
  fields: ResourceFormField<T>[]
  
  // Config
  title?: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
  backUrl?: string
  backLabel?: string
  
  // Handlers
  onSubmit: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
  onSuccess?: () => void
  
  // UI
  className?: string
  formClassName?: string
  contentClassName?: string
  showCard?: boolean
  
  // Dialog/Sheet mode
  variant?: "page" | "dialog" | "sheet"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ResourceForm<T extends Record<string, unknown>>({
  data,
  fields,
  title,
  description,
  submitLabel = "Lưu",
  cancelLabel = "Hủy",
  backUrl,
  backLabel = "Quay lại",
  onSubmit,
  onCancel,
  onSuccess,
  className,
  formClassName,
  contentClassName,
  showCard = true,
  variant = "page",
  open = true,
  onOpenChange,
}: ResourceFormProps<T>) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<Partial<T>>(() => {
    const initial: Partial<T> = {}
    fields.forEach((field) => {
      const key = field.name as keyof T
      initial[key] = (data?.[key] ?? field.defaultValue) as T[keyof T]
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    } as Partial<T>))
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldName]
        return next
      })
    }
    setSubmitError(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    fields.forEach((field) => {
      const fieldName = String(field.name)
      const value = formData[field.name as keyof T]
      
      // Required check
      if (field.required && (value === undefined || value === null || value === "")) {
        newErrors[fieldName] = `${field.label} là bắt buộc`
        return
      }

      // Custom validation
      if (field.validate && value !== undefined && value !== null && value !== "") {
        const validation = field.validate(value)
        if (!validation.valid && validation.error) {
          newErrors[fieldName] = validation.error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    startTransition(async () => {
      try {
        const result = await onSubmit(formData)
        if (result.success) {
          onSuccess?.()
          if (variant === "page") {
            router.refresh()
          } else {
            onOpenChange?.(false)
          }
        } else {
          setSubmitError(result.error ?? "Đã xảy ra lỗi khi lưu")
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu")
      }
    })
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else if (variant === "dialog" || variant === "sheet") {
      onOpenChange?.(false)
    } else if (backUrl) {
      router.push(backUrl)
    }
  }


  const formContent = (
    <form id="resource-form" onSubmit={handleSubmit} className={cn("space-y-6", formClassName)}>
      {submitError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div 
        className={cn("grid gap-6", contentClassName)}
        data-grid-responsive="true"
      >
        {fields.map((field) => {
          const fieldName = String(field.name)
          const value = formData[field.name as keyof T]
          const error = errors[fieldName]
          const isFullWidth = field.type === "textarea" || field.type === "select" || field.render
          
          if (field.type === "checkbox") {
            return (
              <div 
                key={fieldName} 
                className={cn(
                  "min-w-0",
                  isFullWidth && "@md:col-span-full"
                )}
                style={isFullWidth ? undefined : {
                  minWidth: "200px"
                }}
              >
                <Field>
                  {field.icon && (
                    <FieldLabel htmlFor={fieldName}>
                      {field.icon}
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </FieldLabel>
                  )}
                  {renderFieldInput({
                    field,
                    value,
                    error,
                    onChange: (newValue) => handleFieldChange(field.name as string, newValue),
                    isPending,
                  })}
                  {field.description && (
                    <FieldDescription>{field.description}</FieldDescription>
                  )}
                </Field>
              </div>
            )
          }

          return (
            <div 
              key={fieldName} 
              className={cn(
                "min-w-0",
                isFullWidth && "@md:col-span-full"
              )}
              style={isFullWidth ? undefined : {
                minWidth: "200px"
              }}
            >
              <Field orientation="responsive">
                <FieldLabel htmlFor={fieldName}>
                  {field.icon}
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </FieldLabel>
                {renderFieldInput({
                  field,
                  value,
                  error,
                  onChange: (newValue) => handleFieldChange(field.name as string, newValue),
                  isPending,
                })}
                {field.description && (
                  <FieldDescription>{field.description}</FieldDescription>
                )}
              </Field>
            </div>
          )
        })}
      </div>
    </form>
  )


  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isPending}
      >
        {variant === "page" && backUrl ? (
          <>
            <ArrowLeft className="mr-2 h-5 w-5" />
            {cancelLabel}
          </>
        ) : (
          <>
            <X className="mr-2 h-5 w-5" />
            {cancelLabel}
          </>
        )}
      </Button>
      <Button type="submit" form="resource-form" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Đang lưu...
          </>
        ) : (
          <>
            <Save className="mr-2 h-5 w-5" />
            {submitLabel}
          </>
        )}
      </Button>
    </>
  )

  // Dialog mode
  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <ScrollArea className="max-h-[calc(60dvh)] overflow-y-auto">
            <div className="px-6 py-4">
              {formContent}
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 pb-6 pt-4 border-t">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Sheet mode
  if (variant === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6 px-6 mt-6">
            <div className="pr-4">
              {formContent}
            </div>
          </ScrollArea>
          <SheetFooter className="mt-6 border-t pt-4">{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  // Page mode
  const formElement = showCard ? (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={title || description ? undefined : "pt-6"}>
        {formContent}
      </CardContent>
    </Card>
  ) : (
    <div className={className}>
      {formContent}
    </div>
  )

  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 mx-auto w-full max-w-[100%]", className)}>
      {/* Header */}
      {(title || backUrl) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="space-y-1.5 flex-1 min-w-0">
            {backUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(backUrl)}
                className="-ml-2"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                {backLabel}
              </Button>
            )}
            {title && !showCard && (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            )}
            {description && !showCard && (
              <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {formElement}

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {footer}
      </div>
    </div>
  )
}

