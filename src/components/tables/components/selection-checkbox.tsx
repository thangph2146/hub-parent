import { useEffect, useRef } from "react"

export interface SelectionCheckboxProps {
    checked: boolean
    indeterminate: boolean
    disabled?: boolean
    onCheckedChange: (checked: boolean) => void
}

export function SelectionCheckbox({ checked, indeterminate, disabled, onCheckedChange }: SelectionCheckboxProps) {
    const ref = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate
        }
    }, [indeterminate, checked])

    return (
        <input
            ref={ref}
            type="checkbox"
            className="h-6 w-6 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            checked={checked}
            disabled={disabled}
            onChange={(event) => {
                event.stopPropagation()
                onCheckedChange(event.target.checked)
            }}
        />
    )
}
