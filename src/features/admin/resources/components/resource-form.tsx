"use client"

import { useState, useEffect, useRef } from "react"
import { useResourceSegment } from "@/hooks/use-resource-segment"
import { useResourceNavigation, useResourceFormLogger } from "../hooks"
import { logger } from "@/lib/config/logger"
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
import { applyResourceSegmentToPath } from "@/lib/permissions"
import { TypographyH1, TypographyH4, TypographyPMuted, TypographySpanMuted, TypographySpanDestructive, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export interface ResourceFormField<T = unknown> {
  name: keyof T | string
  label: string
  description?: string
  type?: "text" | "email" | "password" | "number" | "textarea" | "select" | "multiple-select" | "checkbox" | "switch" | "date" | "image" | "editor" | "slug"
  sourceField?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  defaultValue?: unknown
  options?: Array<{ label: string; value: string | number }>
  optionGroups?: Array<{ label: string; options: Array<{ label: string; value: string | number }> }>
  icon?: React.ReactNode
  render?: (field: ResourceFormField<T>, value: unknown, onChange: (value: unknown) => void) => React.ReactNode
  validate?: (value: unknown) => { valid: boolean; error?: string }
  section?: string
  className?: string
}

export interface ResourceFormSection {
  id: string
  title?: string
  description?: string
}

export interface ResourceFormProps<T extends Record<string, unknown>> {
  data: T | null
  fields: ResourceFormField<T>[]
  sections?: ResourceFormSection[]

  title?: string
  description?: string
  submitLabel?: string
  cancelLabel?: string
  backUrl?: string
  backLabel?: string

  onSubmit: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
  onSuccess?: () => void
  onBack?: () => void | Promise<void>

  // UI
  className?: string
  formClassName?: string
  contentClassName?: string
  showCard?: boolean

  // Dialog/Sheet mode
  variant?: "page" | "dialog" | "sheet"
  open?: boolean
  onOpenChange?: (open: boolean) => void

  resourceName?: string
  resourceId?: string
  action?: "create" | "update"
}

export const ResourceForm = <T extends Record<string, unknown>>({
  data,
  fields,
  sections,
  title,
  description,
  submitLabel = "Lưu",
  cancelLabel = "Hủy",
  backUrl,
  backLabel = "Quay lại",
  onSubmit,
  onCancel,
  onSuccess,
  onBack,
  className,
  formClassName,
  contentClassName,
  showCard = true,
  variant = "page",
  open = true,
  onOpenChange,
  resourceName,
  resourceId,
  action,
}: ResourceFormProps<T>) => {
  const resourceSegment = useResourceSegment()
  const resolvedBackUrl = backUrl ? applyResourceSegmentToPath(backUrl, resourceSegment) : undefined
  const { navigateBack, router } = useResourceNavigation()

  const handleBack = async () => {
    if (resolvedBackUrl) await navigateBack(resolvedBackUrl, onBack)
  }
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState<Partial<T>>(() => {
    const initial: Partial<T> = {}
    fields.forEach((field) => {
      const key = field.name as keyof T
      const dataValue = data?.[key]

      if (dataValue !== undefined && dataValue !== null) {
        initial[key] = dataValue as T[keyof T]
      } else if (field.defaultValue !== undefined) {
        initial[key] = field.defaultValue as T[keyof T]
      } else if (field.type === "multiple-select") {
        initial[key] = [] as T[keyof T]
      } else if (field.type === "checkbox" || field.type === "switch") {
        initial[key] = false as T[keyof T]
      } else if (field.type !== "number") {
        initial[key] = "" as T[keyof T]
      }
    })
    return initial
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const detectedAction: "create" | "update" = action || (data?.id ? "update" : "create")
  const detectedResourceId = resourceId || (data?.id as string | undefined)
  const detectedResourceName = resourceName || "resource"

  useEffect(() => {
    if (!data) return

    setFormData((prev) => {
      const updated: Partial<T> = { ...prev }
      let hasChanges = false

      fields.forEach((field) => {
        const key = field.name as keyof T
        const dataValue = data[key]
        const currentValue = prev[key]
        if (field.type === "multiple-select") {
          // Multiple-select: luôn là array
          const newValue = Array.isArray(dataValue)
            ? dataValue
            : (dataValue !== undefined && dataValue !== null ? [dataValue] : [])

          // So sánh array
          const currentArray = Array.isArray(currentValue) ? currentValue : []
          if (JSON.stringify(newValue) !== JSON.stringify(currentArray)) {
            updated[key] = newValue as T[keyof T]
            hasChanges = true
          }
        } else if (field.type === "checkbox" || field.type === "switch") {
          const newValue = dataValue !== undefined && dataValue !== null ? Boolean(dataValue) : false
          if (newValue !== currentValue) {
            updated[key] = newValue as T[keyof T]
            hasChanges = true
          }
        } else if (field.type === "number") {
          if (dataValue !== undefined && dataValue !== null) {
            const newValue = typeof dataValue === "number" ? dataValue : Number(dataValue)
            if (newValue !== currentValue && !isNaN(newValue)) {
              updated[key] = newValue as T[keyof T]
              hasChanges = true
            }
          }
        } else {
          if (dataValue !== undefined) {
            const newValue = dataValue === null ? "" : dataValue
            const arraysEqual = Array.isArray(newValue) && Array.isArray(currentValue)
              ? JSON.stringify(newValue) !== JSON.stringify(currentValue)
              : false

            if (arraysEqual || (!Array.isArray(newValue) && newValue !== currentValue)) {
              updated[key] = newValue as T[keyof T]
              hasChanges = true
            }
          } else if (currentValue === undefined && field.type !== undefined) {
            updated[key] = "" as T[keyof T]
            hasChanges = true
          }
        }
      })

      return hasChanges ? updated : prev
    })
  }, [data, fields])

  useResourceFormLogger({
    resourceName: detectedResourceName,
    resourceId: detectedResourceId,
    action: detectedAction,
    formData: formData as T | null,
    isSubmitting: isPending,
    submitSuccess,
    submitError,
  })

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value } as Partial<T>))
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

      if (!field.required) {
        if (field.validate && value !== undefined && value !== null && value !== "") {
          const validation = field.validate(value)
          if (!validation.valid && validation.error) {
            newErrors[fieldName] = validation.error
          }
        }
        return
      }

      const hasValue = field.name in formData
      let isEmpty = false

      if (!hasValue) {
        isEmpty = true
      } else if (field.type === "multiple-select") {
        isEmpty = !Array.isArray(value) || value.length === 0
      } else if (field.type === "select") {
        isEmpty = value === undefined || value === null || value === ""
      } else if (field.type === "checkbox" || field.type === "switch") {
        isEmpty = value !== true
      } else if (field.type === "number") {
        isEmpty = value === undefined || value === null || (typeof value === "number" && isNaN(value))
      } else {
        isEmpty = value === undefined || value === null || value === ""
      }

      if (isEmpty) {
        newErrors[fieldName] = `${field.label} là bắt buộc`
        return
      }

      if (field.validate) {
        const validation = field.validate(value)
        if (!validation.valid && validation.error) {
          newErrors[fieldName] = validation.error
        }
      }
    })

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      scrollToField(Object.keys(newErrors)[0])
    }
    return Object.keys(newErrors).length === 0
  }

  const scrollToField = (fieldName: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fieldElement = document.getElementById(fieldName)
        if (!fieldElement) {
          const fieldByName = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
          if (!fieldByName) return
          fieldByName.scrollIntoView({ behavior: "smooth", block: "center" })
          fieldByName.focus()
          return
        }

        let scrollContainer: HTMLElement | null = null

        if (variant === "dialog") {
          const dialog = fieldElement.closest('[role="dialog"]')
          scrollContainer = dialog?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
        } else if (variant === "sheet") {
          const sheet = fieldElement.closest('[data-state]')
          scrollContainer = sheet?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
        } else {
          const form = fieldElement.closest('form')
          if (form) {
            let parent = form.parentElement
            while (parent && parent !== document.body) {
              const overflow = window.getComputedStyle(parent).overflowY
              if (overflow === "auto" || overflow === "scroll") {
                scrollContainer = parent
                break
              }
              parent = parent.parentElement
            }
          }
        }

        if (scrollContainer) {
          const elementRect = fieldElement.getBoundingClientRect()
          const containerRect = scrollContainer.getBoundingClientRect()
          const scrollTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 20
          scrollContainer.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" })
        } else {
          fieldElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }

        setTimeout(() => {
          const input = fieldElement.querySelector<HTMLElement>("input, textarea, select, [role='combobox']")
          if (input) {
            input.focus()
            if (input instanceof HTMLElement) {
              input.scrollIntoView({ behavior: "smooth", block: "nearest" })
            }
          }
        }, 100)
      })
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsPending(true)
    setSubmitSuccess(false)
    setSubmitError(null)
    try {
      const result = await onSubmit(formData)
      if (result.success) {
        setSubmitSuccess(true)
        onSuccess?.()
        if (variant === "page") {
          if (onOpenChange) {
            onOpenChange(false)
          }
        } else {
          onOpenChange?.(false)
        }
      } else {
        setSubmitError(result.error ?? "Đã xảy ra lỗi khi lưu")
        setSubmitSuccess(false)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu")
      setSubmitSuccess(false)
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = () => {
    logger.info("❌ Cancel button clicked", {
      source: "form-cancel-button",
      variant,
      hasOnCancel: !!onCancel,
      hasResolvedBackUrl: !!resolvedBackUrl,
      resourceName,
      resourceId,
      action,
      currentPath: typeof window !== "undefined" ? window.location.pathname : undefined,
    })

    if (onCancel) {
      logger.debug("📞 Gọi onCancel callback")
      onCancel()
    } else if (variant === "dialog" || variant === "sheet") {
      logger.debug("🚪 Đóng dialog/sheet")
      onOpenChange?.(false)
    } else if (resolvedBackUrl) {
      logger.debug("➡️ Navigate về backUrl từ cancel button", {
        backUrl: resolvedBackUrl,
      })
      navigateBack(resolvedBackUrl, onBack).catch(() => {
        logger.warn("⚠️ NavigateBack failed, fallback to router.replace", {
          backUrl: resolvedBackUrl,
        })
        router.replace(resolvedBackUrl)
      })
    }
  }

  const groupFieldsBySection = () => {
    const grouped: Record<string, ResourceFormField<T>[]> = {}
    const ungrouped: ResourceFormField<T>[] = []

    fields.forEach((field) => {
      if (field.section) {
        grouped[field.section] ??= []
        grouped[field.section].push(field)
      } else {
        ungrouped.push(field)
      }
    })

    return { grouped, ungrouped }
  }

  const renderField = (field: ResourceFormField<T>) => {
    const fieldName = String(field.name)
    const value = formData[field.name as keyof T]
    const error = errors[fieldName]
    const sourceValue = field.sourceField ? formData[field.sourceField as keyof T] : undefined
    const fullWidthTypes = ["textarea", "select", "image", "editor", "slug"]
    const isFullWidth = fullWidthTypes.includes(field.type || "") || !!field.render
    const isEditorField = field.type === "editor"
    const isCheckbox = field.type === "checkbox"
    const fieldInput = renderFieldInput({
      field,
      value,
      error,
      onChange: (newValue) => handleFieldChange(field.name as string, newValue),
      isPending,
      sourceValue,
    })

    return (
      <Flex
        key={fieldName}
        id={fieldName}
        direction="col"
        minWidth={isFullWidth ? "full" : "120"}
        className={cn(isEditorField ? "col-span-full" : (isFullWidth && "@md:col-span-full"))}
      >
        <Field orientation={isCheckbox ? undefined : "responsive"}>
          {(!isCheckbox || field.icon) && (
            <FieldLabel htmlFor={fieldName}>
              {field.icon}
              {field.label}
              {field.required && <TypographySpanDestructive>*</TypographySpanDestructive>}
            </FieldLabel>
          )}
          {fieldInput}
          {field.description && <FieldDescription>{field.description}</FieldDescription>}
        </Field>
      </Flex>
    )
  }

  const renderSection = (sectionId: string, sectionFields: ResourceFormField<T>[]) => {
    const sectionInfo = sections?.find((s) => s.id === sectionId)
    const gridCols = sectionFields.length >= 2 ? ("2-lg" as const) : (1 as const)

    return (
      <Flex key={sectionId} direction="col" gap={6} fullWidth>
        {sectionInfo && (sectionInfo.title || sectionInfo.description) && (
          <Flex direction="col" gap={2} paddingBottom={2} border="b-border-50">
            {sectionInfo.title && <TypographyH4>{sectionInfo.title}</TypographyH4>}
            {sectionInfo.description && <TypographyPMuted>{sectionInfo.description}</TypographyPMuted>}
          </Flex>
        )}
        <Grid cols={gridCols} fullWidth gap={6}>
          {sectionFields.map(renderField)}
        </Grid>
      </Flex>
    )
  }

  const { grouped, ungrouped } = groupFieldsBySection()

  const formContent = (
    <form id="resource-form" ref={formRef} onSubmit={handleSubmit} className={formClassName}>
      <Flex direction="col" fullWidth gap={6}>
        {submitError && (
          <Flex align="center" gap={2} fullWidth rounded="lg" bg="destructive-text" border="all" padding="md" className="border-destructive/20">
            <TypographySpanMuted className="font-medium">{submitError}</TypographySpanMuted>
          </Flex>
        )}

        <Flex direction="col" gap={8} fullWidth className={contentClassName}>
          {Object.entries(grouped).map(([sectionId, sectionFields]) => renderSection(sectionId, sectionFields))}
          {ungrouped.length > 0 && (
            <Grid cols="2-lg" fullWidth gap={6}>
              {ungrouped.map(renderField)}
            </Grid>
          )}
        </Flex>
      </Flex>
    </form>
  )


  const footerButtons = (
    <>
      <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending} className="h-9">
        <Flex align="center" gap={2}>
          <IconSize size="sm">{variant === "page" && resolvedBackUrl ? <ArrowLeft /> : <X />}</IconSize>
          {cancelLabel}
        </Flex>
      </Button>
      <Button type="submit" form="resource-form" disabled={isPending} className="h-9">
        <Flex align="center" gap={2}>
          {isPending ? (
            <>
              <IconSize size="sm"><Loader2 className="animate-spin" /></IconSize>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <IconSize size="sm"><Save /></IconSize>
              <span>{submitLabel || "Lưu"}</span>
            </>
          )}
        </Flex>
      </Button>
    </>
  )

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full p-0">
          <Flex direction="col" align="start" justify="start" gap={0} fullWidth height="full">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription className="mt-2">{description}</DialogDescription>}
            </DialogHeader>
            <ScrollArea className="max-h-[calc(60dvh)] overflow-y-auto flex-1">
              <Flex direction="col" align="start" justify="start" gap={0} fullWidth padding="lg">
                {formContent}
              </Flex>
            </ScrollArea>
            <DialogFooter className="px-6 pb-6 pt-4 border-t border-border/50">
              <Flex align="center" gap={3}>
                {footerButtons}
              </Flex>
            </DialogFooter>
          </Flex>
        </DialogContent>
      </Dialog>
    )
  }

  if (variant === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <Flex direction="col" fullWidth height="full">
            <SheetHeader className="pb-4 border-b border-border/50">
              <SheetTitle>{title}</SheetTitle>
              {description && <SheetDescription className="mt-2">{description}</SheetDescription>}
            </SheetHeader>
            <ScrollArea className="flex-1 -mx-6 px-6 mt-6">
              <Flex direction="col" fullWidth className="pr-4">
                {formContent}
              </Flex>
            </ScrollArea>
            <SheetFooter className="mt-6 border-t border-border/50 pt-4">
              <Flex align="center" gap={3}>
                {footerButtons}
              </Flex>
            </SheetFooter>
          </Flex>
        </SheetContent>
      </Sheet>
    )
  }

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
    <Flex direction="col" gap={4} fullWidth flex="1" marginX="auto" padding="md" className={className}>
      {formContent}
    </Flex>
  )

  return (
    <>
      {(title || resolvedBackUrl) && !showCard && (
        <Flex
          direction="col-lg-row-items-center"
          fullWidth
          align="start"
          justify="between"
          gap={4}
          paddingBottom={6}
          border="b-border"
        >
          <Flex direction="col" gap={3} fullWidth flex="1" minWidth="0" className="lg:w-1/3">
            {resolvedBackUrl && (
              <Button variant="outline" size="sm" onClick={handleBack} className="h-8">
                <Flex align="center" gap={2}>
                  <IconSize size="sm"><ArrowLeft /></IconSize>
                  {backLabel}
                </Flex>
              </Button>
            )}
            <Flex direction="col" gap={2} minWidth="0">
              {title && <TypographyH1 className="truncate">{title}</TypographyH1>}
              {description && <TypographyPMuted className="line-clamp-2">{description}</TypographyPMuted>}
            </Flex>
          </Flex>
        </Flex>
      )}

      <Flex fullWidth flex="1" marginX="auto" padding="md">
        {formElement}
      </Flex>

      <Flex
        align="center"
        justify="end"
        gap={3}
        fullWidth
        paddingY={4}
        paddingX={4}
        border="top"
        className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10"
      >
        {footerButtons}
      </Flex>
    </>
  )
}

