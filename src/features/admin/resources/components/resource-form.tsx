"use client";

import { useState, useEffect, useRef } from "react";
import { useResourceSegment } from "@/hooks/use-resource-segment";
import { useResourceNavigation, useResourceFormLogger } from "../hooks";
import { logger } from "@/lib/config/logger";
import { Loader2, Save, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { cn, arraysEqual } from "@/lib/utils";
import { renderFieldInput } from "./form-fields";
import { applyResourceSegmentToPath } from "@/lib/permissions";
import {
  TypographyH1,
  TypographyPMuted,
  TypographySpanMuted,
  TypographySpanDestructive,
  IconSize,
} from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

export interface ResourceFormField<T = unknown> {
  name: keyof T | string;
  label: string;
  description?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "multiple-select"
    | "permissions-table"
    | "checkbox"
    | "switch"
    | "date"
    | "image"
    | "avatar"
    | "editor"
    | "slug";
  sourceField?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string | number }>;
  optionGroups?: Array<{
    label: string;
    options: Array<{ label: string; value: string | number }>;
  }>;
  icon?: React.ReactNode;
  render?: (
    field: ResourceFormField<T>,
    value: unknown,
    onChange: (value: unknown) => void
  ) => React.ReactNode;
  validate?: (value: unknown) => { valid: boolean; error?: string };
  section?: string;
  className?: string;
}

export interface ResourceFormSection {
  id: string;
  title?: string;
  description?: string;
}

export interface ResourceFormProps<T extends Record<string, unknown>> {
  data: T | null;
  fields: ResourceFormField<T>[];
  sections?: ResourceFormSection[];

  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  backUrl?: string;
  backLabel?: string;

  onSubmit: (data: Partial<T>) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  onSuccess?: () => void;
  onBack?: () => void | Promise<void>;

  // UI
  className?: string;
  formClassName?: string;
  contentClassName?: string;
  showCard?: boolean;

  // Dialog/Sheet mode
  variant?: "page" | "dialog" | "sheet";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  resourceName?: string;
  resourceId?: string;
  action?: "create" | "update";

  // prefix content
  prefixContent?: React.ReactNode;
  prefixClassName?: string;

  // suffix content
  suffixContent?: React.ReactNode;
  suffixClassName?: string;

  // Custom footer buttons (overrides default footer buttons)
  footerButtons?: React.ReactNode;

  // Read-only mode (for detail view)
  readOnly?: boolean;
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
  className: _className,
  formClassName,
  contentClassName,
  showCard = true,
  variant = "page",
  open: _open = true,
  onOpenChange,
  resourceName,
  resourceId,
  action,
  prefixContent,
  prefixClassName,
  suffixContent,
  suffixClassName,
  footerButtons: customFooterButtons,
  readOnly = false,
}: ResourceFormProps<T>) => {
  const resourceSegment = useResourceSegment();
  const resolvedBackUrl = backUrl
    ? applyResourceSegmentToPath(backUrl, resourceSegment)
    : undefined;
  const { navigateBack, router } = useResourceNavigation();

  const handleBack = async () => {
    if (resolvedBackUrl) await navigateBack(resolvedBackUrl, onBack);
  };
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(() => {
    const initial: Partial<T> = {};
    fields.forEach((field) => {
      const key = field.name as keyof T;
      const dataValue = data?.[key];

      if (dataValue !== undefined && dataValue !== null) {
        initial[key] = dataValue as T[keyof T];
      } else if (field.defaultValue !== undefined) {
        initial[key] = field.defaultValue as T[keyof T];
      } else if (field.type === "multiple-select") {
        initial[key] = [] as T[keyof T];
      } else if (field.type === "checkbox" || field.type === "switch") {
        initial[key] = false as T[keyof T];
      } else if (field.type !== "number") {
        initial[key] = "" as T[keyof T];
      }
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const detectedAction: "create" | "update" =
    action || (data?.id ? "update" : "create");
  const detectedResourceId = resourceId || (data?.id as string | undefined);
  const detectedResourceName = resourceName || "resource";

  useEffect(() => {
    if (!data) return;

    setFormData((prev) => {
      const updated: Partial<T> = { ...prev };
      let hasChanges = false;

      fields.forEach((field) => {
        const key = field.name as keyof T;
        const dataValue = data[key];
        const currentValue = prev[key];
        if (field.type === "multiple-select") {
          // Multiple-select: luôn là array
          const newValue = Array.isArray(dataValue)
            ? dataValue
            : dataValue !== undefined && dataValue !== null
            ? [dataValue]
            : [];

          // So sánh array
          const currentArray = Array.isArray(currentValue) ? currentValue : [];
          if (!arraysEqual(newValue, currentArray)) {
            updated[key] = newValue as T[keyof T];
            hasChanges = true;
          }
        } else if (field.type === "checkbox" || field.type === "switch") {
          const newValue =
            dataValue !== undefined && dataValue !== null
              ? Boolean(dataValue)
              : false;
          if (newValue !== currentValue) {
            updated[key] = newValue as T[keyof T];
            hasChanges = true;
          }
        } else if (field.type === "number") {
          if (dataValue !== undefined && dataValue !== null) {
            const newValue =
              typeof dataValue === "number" ? dataValue : Number(dataValue);
            if (newValue !== currentValue && !isNaN(newValue)) {
              updated[key] = newValue as T[keyof T];
              hasChanges = true;
            }
          }
        } else {
          if (dataValue !== undefined) {
            const newValue = dataValue === null ? "" : dataValue;
            const isArrayChanged =
              Array.isArray(newValue) && Array.isArray(currentValue)
                ? !arraysEqual(newValue, currentValue)
                : false;

            if (
              isArrayChanged ||
              (!Array.isArray(newValue) && newValue !== currentValue)
            ) {
              updated[key] = newValue as T[keyof T];
              hasChanges = true;
            }
          } else if (currentValue === undefined && field.type !== undefined) {
            updated[key] = "" as T[keyof T];
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [data, fields]);

  useResourceFormLogger({
    resourceName: detectedResourceName,
    resourceId: detectedResourceId,
    action: detectedAction,
    formData: formData as T | null,
    isSubmitting: isPending,
    submitSuccess,
    submitError,
  });

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value } as Partial<T>));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const fieldName = String(field.name);
      const value = formData[field.name as keyof T];

      if (!field.required) {
        if (
          field.validate &&
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {
          const validation = field.validate(value);
          if (!validation.valid && validation.error) {
            newErrors[fieldName] = validation.error;
          }
        }
        return;
      }

      const hasValue = field.name in formData;
      let isEmpty = false;

      if (!hasValue) {
        isEmpty = true;
      } else if (field.type === "multiple-select") {
        isEmpty = !Array.isArray(value) || value.length === 0;
      } else if (field.type === "select") {
        isEmpty = value === undefined || value === null || value === "";
      } else if (field.type === "checkbox" || field.type === "switch") {
        isEmpty = value !== true;
      } else if (field.type === "number") {
        isEmpty =
          value === undefined ||
          value === null ||
          (typeof value === "number" && isNaN(value));
      } else {
        isEmpty = value === undefined || value === null || value === "";
      }

      if (isEmpty) {
        newErrors[fieldName] = `${field.label} là bắt buộc`;
        return;
      }

      if (field.validate) {
        const validation = field.validate(value);
        if (!validation.valid && validation.error) {
          newErrors[fieldName] = validation.error;
        }
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      scrollToField(Object.keys(newErrors)[0]);
    }
    return Object.keys(newErrors).length === 0;
  };

  const scrollToField = (fieldName: string) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fieldElement = document.getElementById(fieldName);
        if (!fieldElement) {
          const fieldByName = document.querySelector(
            `[name="${fieldName}"]`
          ) as HTMLElement;
          if (!fieldByName) return;
          fieldByName.scrollIntoView({ behavior: "smooth", block: "center" });
          fieldByName.focus();
          return;
        }

        let scrollContainer: HTMLElement | null = null;

        if (variant === "dialog") {
          const dialog = fieldElement.closest('[role="dialog"]');
          scrollContainer = dialog?.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLElement | null;
        } else if (variant === "sheet") {
          const sheet = fieldElement.closest("[data-state]");
          scrollContainer = sheet?.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLElement | null;
        } else {
          const form = fieldElement.closest("form");
          if (form) {
            let parent = form.parentElement;
            while (parent && parent !== document.body) {
              const overflow = window.getComputedStyle(parent).overflowY;
              if (overflow === "auto" || overflow === "scroll") {
                scrollContainer = parent;
                break;
              }
              parent = parent.parentElement;
            }
          }
        }

        if (scrollContainer) {
          const elementRect = fieldElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const scrollTop =
            scrollContainer.scrollTop +
            (elementRect.top - containerRect.top) -
            20;
          scrollContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: "smooth",
          });
        } else {
          fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        setTimeout(() => {
          const input = fieldElement.querySelector<HTMLElement>(
            "input, textarea, select, [role='combobox']"
          );
          if (input) {
            input.focus();
            if (input instanceof HTMLElement) {
              input.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }
        }, 100);
      });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsPending(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        setSubmitSuccess(true);
        onSuccess?.();
        if (variant === "page") {
          if (onOpenChange) {
            onOpenChange(false);
          }
        } else {
          onOpenChange?.(false);
        }
      } else {
        setSubmitError(result.error ?? "Đã xảy ra lỗi khi lưu");
        setSubmitSuccess(false);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Đã xảy ra lỗi khi lưu"
      );
      setSubmitSuccess(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    logger.info("❌ Cancel button clicked", {
      source: "form-cancel-button",
      variant,
      hasOnCancel: !!onCancel,
      hasResolvedBackUrl: !!resolvedBackUrl,
      resourceName,
      resourceId,
      action,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : undefined,
    });

    if (onCancel) {
      logger.debug("📞 Gọi onCancel callback");
      onCancel();
    } else if (variant === "dialog" || variant === "sheet") {
      logger.debug("🚪 Đóng dialog/sheet");
      onOpenChange?.(false);
    } else if (resolvedBackUrl) {
      logger.debug("➡️ Navigate về backUrl từ cancel button", {
        backUrl: resolvedBackUrl,
      });
      navigateBack(resolvedBackUrl, onBack).catch(() => {
        logger.warn("⚠️ NavigateBack failed, fallback to router.replace", {
          backUrl: resolvedBackUrl,
        });
        router.replace(resolvedBackUrl);
      });
    }
  };

  const groupFieldsBySection = () => {
    const grouped: Record<string, ResourceFormField<T>[]> = {};
    const ungrouped: ResourceFormField<T>[] = [];

    fields.forEach((field) => {
      if (field.section) {
        grouped[field.section] ??= [];
        grouped[field.section].push(field);
      } else {
        ungrouped.push(field);
      }
    });

    return { grouped, ungrouped };
  };

  const renderField = (field: ResourceFormField<T>) => {
    const fieldName = String(field.name);
    const value = formData[field.name as keyof T];
    const error = errors[fieldName];
    const sourceValue = field.sourceField
      ? formData[field.sourceField as keyof T]
      : undefined;
    const isCheckbox = field.type === "checkbox";
    const hasError = !!error;
    const fieldInput = renderFieldInput({
      field,
      value,
      error,
      onChange: (newValue) => handleFieldChange(field.name as string, newValue),
      isPending: isPending || readOnly,
      sourceValue,
      readOnly: readOnly || field.disabled,
    });

    return (
        <Field
        key={fieldName}
        id={fieldName}
        orientation={isCheckbox ? undefined : "vertical"}
        data-invalid={hasError}
        className={cn(
          "py-1.5 h-full",
          readOnly && "!opacity-100",
          field.className
        )}
      >
        {(!isCheckbox || field.icon) && (field.label || field.icon) && (
          <FieldLabel
            htmlFor={fieldName}
            className={cn(
              "min-h-[1.5rem]",
              hasError && "text-destructive/90",
              !hasError && "group-hover/field:text-foreground",
              readOnly && "!opacity-100"
            )}
          >
            {field.icon && (
              <span className="transition-transform duration-200 group-hover/field-label:scale-110">
                {field.icon}
              </span>
            )}
            {field.label && (
              <span className="font-medium whitespace-nowrap">{field.label}</span>
            )}
            {field.required && !readOnly && (
              <TypographySpanDestructive className="shrink-0">
                *
              </TypographySpanDestructive>
            )}
          </FieldLabel>
        )}
        <FieldContent>
          {fieldInput}
          {field.description && (
            <FieldDescription className={cn(readOnly && "!opacity-100")}>
              {field.description}
            </FieldDescription>
          )}
        </FieldContent>
      </Field>
    );
  };

  const renderSectionHeader = (title?: string, description?: string) => {
    if (!title && !description) return null
    return (
      <>
        {title && <FieldLegend variant="legend">{title}</FieldLegend>}
        {description && <FieldDescription variant="section">{description}</FieldDescription>}
      </>
    )
  }

  const renderSection = (
    sectionId: string,
    sectionFields: ResourceFormField<T>[]
  ) => {
    const sectionInfo = sections?.find((s) => s.id === sectionId);

    return (
      <FieldSet
        key={sectionId}
        className={cn(
          "group/field-set transition-all duration-300",
          readOnly && "!opacity-100"
        )}
      >
        {renderSectionHeader(sectionInfo?.title, sectionInfo?.description)}
        <Grid
          cols="responsive-3"
          gap={2}
          gapY={4}
          className={cn(
            "w-full transition-all duration-300",
            readOnly && "!opacity-100"
          )}
        >
          {sectionFields.map((field) => {
            // Avatar field: 1 col (xs), 2 col (sm), 3 col (lg)
            const isAvatar = field.name === "avatar" || field.type === "avatar";
            // Editor fields or fields with max-w should span full width
            const isEditor = field.type === "editor";
            const hasMaxWidth = field.className?.includes("max-w");
            const isFullSpan = field.className?.includes("col-span-full") || isEditor || hasMaxWidth;
            
            // Determine column span classes
            let colSpanClass = "";
            if (isFullSpan) {
              colSpanClass = "col-span-1 sm:col-span-2 lg:col-span-3";
            } else if (isAvatar) {
              colSpanClass = "col-span-1 sm:col-span-1 lg:col-span-1";
            }
            
            return (
              <div
                key={String(field.name)}
                className={cn(
                  "flex items-stretch min-w-0",
                  colSpanClass
                )}
              >
                {renderField(field)}
              </div>
            );
          })}
        </Grid>
      </FieldSet>
    );
  };

  const { grouped, ungrouped } = groupFieldsBySection();

  const formContent = (
    <form
      id="resource-form"
      ref={formRef}
      onSubmit={handleSubmit}
      className={formClassName}
    >
      <Flex direction="col" gap={4} width="full">
        {submitError && (
          <Flex
            align="center"
            gap={2}
            width="full"
            rounded="lg"
            border="all"
            bg="destructive-text"
            padding="md"
            className={cn(
              "border-destructive/20 transition-all duration-300 shadow-sm"
            )}
          >
            <TypographySpanMuted className="font-medium">
              {submitError}
            </TypographySpanMuted>
          </Flex>
        )}
        {/* prefix content */}
        <Flex direction="col" gap={4} className={cn("w-full", prefixClassName)}>
          {prefixContent}
        </Flex>

        {/* Content */}
        <Flex direction="col" gap={4} className={cn("w-full", contentClassName)}>
          {Object.entries(grouped).map(([sectionId, sectionFields]) =>
            renderSection(sectionId, sectionFields)
          )}
          {ungrouped.length > 0 && (
            <Grid
              cols="responsive-3"
              gap={2}
              gapY={4}
              className={cn("w-full", readOnly && "!opacity-100")}
            >
              {ungrouped.map((field) => {
                const isAvatar = field.name === "avatar" || field.type === "avatar";
                const isEditor = field.type === "editor";
                const hasMaxWidth = field.className?.includes("max-w");
                const isFullSpan = field.className?.includes("col-span-full") || isEditor || hasMaxWidth;
                
                let colSpanClass = "";
                if (isFullSpan) {
                  colSpanClass = "col-span-1 sm:col-span-2 lg:col-span-3";
                } else if (isAvatar) {
                  colSpanClass = "col-span-1 sm:col-span-1 lg:col-span-1";
                }
                
                return (
                  <div
                    key={String(field.name)}
                    className={cn(
                      "flex items-stretch min-w-0",
                      colSpanClass
                    )}
                  >
                    {renderField(field)}
                  </div>
                );
              })}
            </Grid>
          )}
        </Flex>

        {/* suffix content */}
        <Flex direction="col" gap={4} className={cn("w-full", suffixClassName)}>
          {suffixContent}
        </Flex>
      </Flex>
    </form>
  );

  const footerButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleCancel}
        disabled={isPending}
        className="h-9 disabled:!opacity-100"
      >
        <Flex align="center" gap={2}>
          <IconSize size="sm">
            {variant === "page" && resolvedBackUrl ? <ArrowLeft /> : <X />}
          </IconSize>
          {cancelLabel}
        </Flex>
      </Button>
      <Button
        type="submit"
        form="resource-form"
        disabled={isPending}
        className="h-9 disabled:!opacity-100"
      >
        <Flex align="center" gap={2}>
          {isPending ? (
            <>
              <IconSize size="sm">
                <Loader2 className="animate-spin" />
              </IconSize>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <IconSize size="sm" className="text-primary-foreground">
                <Save />
              </IconSize>
              <span className="text-primary-foreground">{submitLabel || "Lưu"}</span>
            </>
          )}
        </Flex>
      </Button>
    </>
  );

  return (
    <>
      {(title || resolvedBackUrl) && !showCard && (
        <Flex
          direction="col"
          width="full"
          border="bottom"
          gap={6}
        >
          {resolvedBackUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="w-fit h-9"
            >
              <Flex align="center" gap={0.5}>
                <IconSize size="sm">
                  <ArrowLeft />
                </IconSize>
                {backLabel}
              </Flex>
            </Button>
          )}
          <Flex direction="col" gap={3} className="min-w-0">
            {title && (
              <TypographyH1 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight">
                {title}
              </TypographyH1>
            )}
            {description && (
              <TypographyPMuted className="text-xs sm:text-sm text-muted-foreground/80 italic line-clamp-2">
                {description}
              </TypographyPMuted>
            )}
          </Flex>
        </Flex>
      )}

      {formContent}

      {(customFooterButtons || (!readOnly && footerButtons)) && (
        <Flex
          align="center"
          justify="end"
          gap={2}
          width="full"
          border="top"
          position="sticky"
          paddingY="2"
          bg="background"
          style={{
            backdropFilter: "blur(8px)",
            bottom: 0,
            zIndex: 10,
          }}
          className={_className}
        >
          {customFooterButtons || footerButtons}
        </Flex>
      )}
    </>
  );
};
