import type { ReactNode } from "react"
import { typography } from "@/lib/typography"

interface SelectionActionsWrapperProps {
  label: ReactNode
  labelSuffix?: ReactNode
  actions: ReactNode
}

export const SelectionActionsWrapper = ({
  label,
  labelSuffix,
  actions,
}: SelectionActionsWrapperProps) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${typography.body.small}`}>
      <div className="flex-shrink-0">
        <span className="block sm:inline">{label}</span>
        {labelSuffix && (
          <span className={`block sm:inline ml-0 sm:ml-2 mt-1 sm:mt-0 ${typography.body.muted.small}`}>
            {labelSuffix}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
    </div>
  )
}

