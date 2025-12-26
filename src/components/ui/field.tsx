"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { responsiveTextSizes, fontWeights, lineHeights } from "@/lib/typography"

const fieldBodySmall = `${responsiveTextSizes.small} ${fontWeights.normal} ${lineHeights.relaxed}`

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        // Fieldset custom styling
        "p-4 px-5 border-2 border-solid border-border rounded-[calc(var(--radius)-2px)] mb-6",
        "bg-background transition-all duration-300",
        "relative overflow-hidden",
        "hover:border-ring/50 hover:shadow-[0_2px_8px_hsl(var(--ring)/0.1)]",
        "dark:bg-card dark:border-border dark:hover:border-ring/60 dark:hover:shadow-[0_2px_8px_hsl(var(--ring)/0.15)]",
        // Gradient accent line on hover
        "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px]",
        "before:bg-gradient-to-r before:from-primary before:via-primary/50 before:to-primary",
        "before:opacity-0 before:transition-opacity before:duration-300",
        "hover:before:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        // Legend custom styling - larger text
        "mx-0 mb-3 px-2 border-b-0 w-auto",
        "font-semibold text-foreground",
        "transition-colors duration-200",
        "relative",
        // Responsive text sizes - override fieldBodyMedium
        variant === "legend" 
          ? "text-sm sm:text-base md:text-lg leading-relaxed"
          : `${fieldBodySmall}`,
        // Gradient accent line
        "after:content-[''] after:absolute after:-bottom-2 after:left-2 after:right-2 after:h-[2px]",
        "after:bg-gradient-to-r after:from-primary after:to-transparent",
        "after:opacity-30 after:transition-opacity after:duration-300",
        "group-hover/field-set:after:opacity-60",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive transition-all duration-200",
  {
    variants: {
      orientation: {
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
        responsive: [
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        "transition-colors duration-200",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        `flex w-fit items-center gap-2 leading-snug font-medium group-data-[disabled=true]/field:opacity-50 ${fieldBodySmall}`,
        className
      )}
      {...props}
    />
  )
}

const fieldDescriptionVariants = cva(
  `text-muted-foreground leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance ${fieldBodySmall} last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5 [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4`,
  {
    variants: {
      textAlign: {
        none: "",
        center: "text-center",
      },
    },
    defaultVariants: {
      textAlign: "none",
    },
  }
)

function FieldDescription({ className, textAlign, ...props }: React.ComponentProps<"p"> & VariantProps<typeof fieldDescriptionVariants>) {
  return (
    <p
      data-slot="field-description"
      className={cn(fieldDescriptionVariants({ textAlign }), className)}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        `relative -my-2 h-5 group-data-[variant=outline]/field-group:-mb-2 ${fieldBodySmall}`,
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      data-slot="field-error"
      className={cn(
        `text-destructive font-normal ${fieldBodySmall}`,
        "animate-in slide-in-from-top-1 fade-in duration-200",
        "flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      <span className="inline-flex h-1 w-1 rounded-full bg-destructive animate-pulse" aria-hidden="true" />
      <span>{content}</span>
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
