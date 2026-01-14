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
}

export function ResourceCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  disabled,
  readOnly,
  label,
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
    <label className="flex items-center gap-2 cursor-pointer">
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
      <span className="font-semibold text-sm text-foreground leading-relaxed">
        {label}
      </span>
    </label>
  );
}
