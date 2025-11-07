/**
 * Command Filter Component (Single select với search)
 */
"use client"

import { useState, useId } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

export function CommandCombobox<T extends object = object>({
    column,
    value,
    disabled,
    onChange,
}: ColumnFilterControlProps<T>) {
    const [open, setOpen] = useState(false)
    const mounted = useClientOnly()
    const filterId = useId()

    if (!column.filter || !("options" in column.filter)) return null

    const selectedOption = column.filter.options.find((opt) => opt.value === value)

    if (!mounted) {
        return (
            <Button
                variant="outline"
                role="combobox"
                className={cn("h-7 sm:h-8 w-full justify-between text-xs font-normal", !value && "text-muted-foreground")}
                disabled={true}
            >
                <span className="truncate text-xs">
                    {selectedOption ? selectedOption.label : column.filter.placeholder ?? "Chọn..."}
                </span>
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
                    className={cn("h-7 sm:h-8 w-full justify-between text-xs font-normal", !value && "text-muted-foreground")}
                    disabled={disabled}
                >
                    <span className="truncate text-xs">
                        {selectedOption ? selectedOption.label : column.filter.placeholder ?? "Chọn..."}
                    </span>
                    <ChevronsUpDown className="ml-1 sm:ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent id={filterId} className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={column.filter.searchPlaceholder ?? "Tìm kiếm..."} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{column.filter.emptyMessage ?? "Không tìm thấy."}</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value=""
                                onSelect={() => {
                                    onChange("", true)
                                    setOpen(false)
                                }}
                            >
                                <Check className={cn("mr-2 h-3 w-3", value === "" ? "opacity-100" : "opacity-0")} />
                                {column.filter.placeholder ?? "Tất cả"}
                            </CommandItem>
                            {column.filter.options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        onChange(option.value === value ? "" : option.value, true)
                                        setOpen(false)
                                    }}
                                >
                                    <Check className={cn("mr-2 h-3 w-3", value === option.value ? "opacity-100" : "opacity-0")} />
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

