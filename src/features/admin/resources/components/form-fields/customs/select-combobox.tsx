"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { TypographyPMuted, IconSize } from "@/components/ui/typography"
import type { ResourceFormField } from "../../resource-form"
import { Flex } from "@/components/ui/flex"

interface SelectComboboxProps<T> {
  field: ResourceFormField<T>
  fieldValue: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  fieldId?: string
  errorId?: string
}

export const SelectCombobox = <T,>({
  field,
  fieldValue,
  error,
  onChange,
  isPending = false,
  fieldId,
  errorId,
}: SelectComboboxProps<T>) => {
  const [selectOpen, setSelectOpen] = useState(false)

  if (!field.options || field.options.length === 0) {
    return (
      <Flex align="center" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2">
        <TypographyPMuted>Không có tùy chọn</TypographyPMuted>
      </Flex>
    )
  }

  const selectedOption = field.options.find((opt) => String(opt.value) === String(fieldValue))

  return (
    <Popover open={selectOpen} onOpenChange={setSelectOpen}>
      <PopoverTrigger asChild>
        <Button
          id={fieldId || field.name as string}
          variant="outline"
          role="combobox"
          aria-expanded={selectOpen}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={errorId || field.description ? `${fieldId || field.name as string}-description` : undefined}
          className={cn(
            "w-full justify-between h-10",
            !fieldValue && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={field.disabled || isPending}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : field.placeholder || "-- Chọn --"}
          </span>
          <IconSize size="md" className="ml-2 shrink-0 opacity-50">
            <ChevronsUpDown />
          </IconSize>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm..." className="h-9" />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {!field.required && (
                <CommandItem
                  value=""
                  onSelect={() => {
                    onChange("")
                    setSelectOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2",
                      !fieldValue || fieldValue === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {field.placeholder || "-- Chọn --"}
                </CommandItem>
              )}
              {field.options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={String(option.value)}
                  onSelect={() => {
                    onChange(option.value)
                    setSelectOpen(false)
                  }}
                >
                  <IconSize size="md" className={cn("mr-2", String(fieldValue) === String(option.value) ? "opacity-100" : "opacity-0")}>
                    <Check />
                  </IconSize>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

