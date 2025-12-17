import { MoreHorizontal, Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface RowActionConfig {
  label: string
  icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
  isLoading?: boolean
  loadingLabel?: string
}

export const renderRowActions = (actions: RowActionConfig[]) => {
  if (actions.length === 0) return null

  if (actions.length === 1) {
    const singleAction = actions[0]
    const Icon = singleAction.isLoading ? Loader2 : singleAction.icon
    const isDisabled = singleAction.disabled || singleAction.isLoading
    const displayLabel = singleAction.isLoading ? singleAction.loadingLabel || singleAction.label : singleAction.label
    
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        onClick={() => {
          if (!isDisabled) singleAction.onSelect()
        }}
      >
        <Icon className={`mr-2 h-5 w-5 ${singleAction.isLoading ? "animate-spin" : ""}`} />
        {displayLabel}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.isLoading ? Loader2 : action.icon
          const isDisabled = action.disabled || action.isLoading
          const displayLabel = action.isLoading ? action.loadingLabel || action.label : action.label
          
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) action.onSelect()
              }}
              className={
                action.destructive
                  ? "text-destructive focus:text-destructive data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10 disabled:opacity-50"
                  : "data-[highlighted]:bg-accent/10 disabled:opacity-50"
              }
            >
              <Icon
                className={
                  action.destructive
                    ? `mr-2 h-5 w-5 text-destructive ${action.isLoading ? "animate-spin" : ""}`
                    : `mr-2 h-5 w-5 ${action.isLoading ? "animate-spin" : ""}`
                }
              />
              {displayLabel}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

