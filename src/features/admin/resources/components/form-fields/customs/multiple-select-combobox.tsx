"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { TypographyPMuted, TypographyP, IconSize } from "@/components/ui/typography"
import type { ResourceFormField } from "../../resource-form"
import { Flex } from "@/components/ui/flex"

interface MultipleSelectComboboxProps<T> {
  field: ResourceFormField<T>
  fieldValue: unknown
  error?: string
  onChange: (value: unknown) => void
  isPending?: boolean
  fieldId?: string
  errorId?: string
}

export const MultipleSelectCombobox = <T,>({
  field,
  fieldValue,
  error,
  onChange,
  isPending = false,
  fieldId,
  errorId,
}: MultipleSelectComboboxProps<T>) => {
  const [selectOpen, setSelectOpen] = useState(false)

  const selectedValues = Array.isArray(fieldValue) 
    ? fieldValue.map(v => String(v))
    : fieldValue !== null && fieldValue !== undefined && fieldValue !== ""
      ? [String(fieldValue)]
      : []

  // Get all options from groups or flat options
  const allOptions = field.optionGroups
    ? field.optionGroups.flatMap((group) => group.options)
    : field.options || []

  if (allOptions.length === 0) {
    return (
      <Flex align="center" fullWidth height="10" rounded="md" border="all" bg="background" paddingX={3} paddingY={2}>
        <TypographyPMuted>Không có tùy chọn</TypographyPMuted>
      </Flex>
    )
  }

  const selectedOptions = allOptions.filter((opt) => 
    selectedValues.includes(String(opt.value))
  )

  const allSelected = allOptions.length > 0 && selectedValues.length === allOptions.length

  const handleToggle = (optionValue: string | number) => {
    const valueStr = String(optionValue)
    const currentValues = selectedValues
    
    if (currentValues.includes(valueStr)) {
      // Remove if already selected
      const newValues = currentValues.filter(v => v !== valueStr)
      onChange(newValues.length > 0 ? newValues : [])
    } else {
      // Add if not selected
      onChange([...currentValues, valueStr])
    }
  }

  const handleSelectAll = () => {
    const allValues = allOptions.map(opt => String(opt.value))
    onChange(allValues)
  }

  const handleDeselectAll = () => {
    onChange([])
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const displayText = selectedOptions.length > 0
    ? `${selectedOptions.length} mục đã chọn`
    : field.placeholder || "-- Chọn --"

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
            "w-full justify-between h-auto min-h-10 px-3 py-2",
            selectedValues.length === 0 && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={field.disabled || isPending}
        >
          <Flex wrap align="center" gap={1.5} flex="1" minWidth="0">
            {selectedOptions.length > 0 ? (
              selectedOptions.length <= 3 ? (
                // Show badges if <= 3 items
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggle(option.value)
                    }}
                  >
                    {option.label}
                    <IconSize size="xs">
                      <X />
                    </IconSize>
                  </Badge>
                ))
              ) : (
                // Show count if > 3 items
                <TypographyP>{displayText}</TypographyP>
              )
            ) : (
              <TypographyP>{displayText}</TypographyP>
            )}
          </Flex>
          <Flex align="center" gap={1} marginLeft={2} shrink>
            {selectedValues.length > 0 && (
              <Flex
                as="span"
                role="button"
                tabIndex={0}
                align="center"
                justify="center"
                rounded="md"
                height="auto"
                cursor="pointer"
                className="text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-auto w-auto p-0 hover:opacity-70"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleClear(e as unknown as React.MouseEvent<HTMLButtonElement>)
                  }
                }}
                aria-label="Xóa tất cả"
              >
                <IconSize size="md">
                  <X />
                </IconSize>
              </Flex>
            )}
            <IconSize size="md">
              <ChevronsUpDown />
            </IconSize>
          </Flex>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm..." className="h-9" />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            {field.optionGroups ? (
              <>
                {/* Select All option for grouped options */}
                {allOptions.length > 0 && (
                  <CommandGroup>
                    <CommandItem
                      value="select-all"
                      onSelect={() => {
                        if (allSelected) {
                          handleDeselectAll()
                        } else {
                          handleSelectAll()
                        }
                      }}
                      className={cn(
                        "border rounded-md",
                        allSelected && "text-primary"
                      )}
                    >
                      <IconSize size="md">
                        <Check className={cn(allSelected ? "opacity-100" : "opacity-0")} />
                      </IconSize>
                      {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </CommandItem>
                  </CommandGroup>
                )}
                {field.optionGroups.map((group) => (
                  <CommandGroup key={group.label} heading={group.label}>
                    {group.options.map((option) => {
                      const isSelected = selectedValues.includes(String(option.value))
                      return (
                        <CommandItem
                          key={`${group.label}-${option.value}`}
                          value={String(option.value)}
                          onSelect={() => handleToggle(option.value)}
                        >
                          <Flex align="center" gap={2}>
                            <IconSize size="md" className={cn(isSelected ? "opacity-100" : "opacity-0")}>
                              <Check />
                          </IconSize>
                          {option.label}
                          </Flex>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ))}
              </>
            ) : (
              <CommandGroup>
                {/* Select All option for flat options */}
                {allOptions.length > 0 && (
                  <CommandItem
                    value="select-all"
                    onSelect={() => {
                      if (allSelected) {
                        handleDeselectAll()
                      } else {
                        handleSelectAll()
                      }
                    }}
                    className={cn(
                      allSelected && "text-primary"
                    )}
                  >
                    <Flex align="center" gap={2}>
                      <IconSize size="md" className={cn(allSelected ? "opacity-100" : "opacity-0")}>
                        <Check />
                    </IconSize>
                    {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </Flex>
                  </CommandItem>
                )}
                {allOptions.map((option) => {
                  const isSelected = selectedValues.includes(String(option.value))
                  return (
                    <CommandItem
                      key={option.value}
                      value={String(option.value)}
                      onSelect={() => handleToggle(option.value)}
                    >
                      <Flex align="center" gap={2}>
                        <IconSize size="md" className={cn(isSelected ? "opacity-100" : "opacity-0")}>
                          <Check />
                      </IconSize>
                      {option.label}
                      </Flex>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
            {selectedValues.length > 0 && (
              <CommandGroup>
                <CommandItem
                  value="clear-all"
                  onSelect={() => onChange([])}
                  className="text-destructive"
                >
                  Xóa tất cả
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

