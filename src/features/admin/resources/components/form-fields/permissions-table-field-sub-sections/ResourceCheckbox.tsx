import React, { useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/utils";

interface ResourceCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  label: string;
  className?: string;
}

export function ResourceCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  readOnly,
  label,
  className,
}: ResourceCheckboxProps) {
  const checkboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      const element = checkboxRef.current as unknown as {
        indeterminate?: boolean;
      };
      if (element) {
        element.indeterminate = indeterminate;
      }
    }
  }, [indeterminate]);

  return (
    <label className={cn("flex items-center gap-2 cursor-pointer", className)}>
      <Checkbox
        ref={checkboxRef}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        data-readonly={readOnly ? "true" : undefined}
        className={cn(
          readOnly && "!opacity-100 disabled:!opacity-100 [&:disabled]:!opacity-100 cursor-default bg-muted/30 border-muted-foreground/30",
          disabled && !readOnly && "!opacity-100"
        )}
      />
      <span className={cn("font-semibold text-sm text-foreground leading-relaxed", className?.includes("text-xs") && "text-xs font-medium")}>
        {label}
      </span>
    </label>
  );
}
