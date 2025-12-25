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
import { TypographyPMuted, TypographySpanSmall, IconSize } from "@/components/ui/typography"
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
      <Flex align="center" fullWidth height="10" rounded="md" border="all" bg="background" paddingX={3} paddingY={2}>
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
          <Flex align="center" justify="between" gap={2} fullWidth>
            <TypographySpanSmall className="truncate">
              {selectedOption ? selectedOption.label : field.placeholder || "-- Chọn --"}
            </TypographySpanSmall>
            <IconSize size="md" className="shrink-0 opacity-50">
              <ChevronsUpDown />
            </IconSize>
          </Flex>
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
                  <Flex align="center" gap={2}>
                    <IconSize size="md" className={cn(!fieldValue || fieldValue === "" ? "opacity-100" : "opacity-0")}>
                      <Check />
                    </IconSize>
                  {field.placeholder || "-- Chọn --"}
                  </Flex>
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
                  <Flex align="center" gap={2}>
                    <IconSize size="md" className={cn(String(fieldValue) === String(option.value) ? "opacity-100" : "opacity-0")}>
                    <Check />
                  </IconSize>
                  {option.label}
                  </Flex>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

