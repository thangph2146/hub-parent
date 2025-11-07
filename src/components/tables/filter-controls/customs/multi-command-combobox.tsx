/**
 * Multi Command Filter Component (Multi select với search)
 */
"use client"

import { useState, useId } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useClientOnly } from "@/hooks/use-client-only"
import type { ColumnFilterControlProps } from "../types"

export function MultiCommandCombobox<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    const [open, setOpen] = useState(false)
    const mounted = useClientOnly()
    const filterId = useId()

    if (!column.filter || column.filter.type !== "multi-select") return null

    // Parse value từ string (comma-separated) sang array
    const selectedValues = value ? value.split(",").filter((v) => v.trim()) : []
    const selectedOptions = column.filter.options.filter((opt) => selectedValues.includes(opt.value))

    const handleToggle = (optionValue: string) => {
        const currentValues = selectedValues
        let newValues: string[]

        if (currentValues.includes(optionValue)) {
            newValues = currentValues.filter((v) => v !== optionValue)
        } else {
            newValues = [...currentValues, optionValue]
        }

        onChange(newValues.length > 0 ? newValues.join(",") : "", true)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange("", true)
    }

    const displayText =
        selectedOptions.length > 0
            ? selectedOptions.length <= 3
                ? selectedOptions.map((opt) => opt.label).join(", ")
                : `${selectedOptions.length} mục đã chọn`
            : column.filter.placeholder ?? "Chọn..."

    if (!mounted) {
        return (
            <Button
                variant="outline"
                role="combobox"
                className={cn(
                    "h-7 sm:h-8 w-full justify-between text-xs font-normal",
                    selectedValues.length === 0 && "text-muted-foreground",
                )}
                disabled={true}
            >
                <span className="truncate text-xs">{displayText}</span>
                <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={filterId}
                    className={cn(
                        "h-auto min-h-7 sm:min-h-8 w-full justify-between text-xs font-normal px-2 py-1",
                        selectedValues.length === 0 && "text-muted-foreground",
                    )}
                    disabled={disabled}
                >
                    <div className="flex flex-1 flex-wrap gap-1 items-center min-w-0 mr-1">
                        {selectedOptions.length > 0 && selectedOptions.length <= 3 ? (
                            selectedOptions.map((option) => (
                                <Badge key={option.value} variant="secondary" className="text-xs mr-0">
                                    {option.label}
                                </Badge>
                            ))
                        ) : (
                            <span className="truncate text-xs">{displayText}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {selectedValues.length > 0 && (
                            <X
                                className="h-3 w-3 text-muted-foreground hover:text-foreground"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent id={filterId} className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={column.filter.searchPlaceholder ?? "Tìm kiếm..."} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{column.filter.emptyMessage ?? "Không tìm thấy."}</CommandEmpty>
                        <CommandGroup>
                            {column.filter.options.map((option) => {
                                const isSelected = selectedValues.includes(option.value)
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => handleToggle(option.value)}
                                    >
                                        <Check className={cn("mr-2 h-3 w-3", isSelected ? "opacity-100" : "opacity-0")} />
                                        {option.label}
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

