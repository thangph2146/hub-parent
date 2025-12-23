import type { ReactNode } from "react"
import { TypographySpanSmall, TypographySpanSmallMuted } from "@/components/ui/typography"

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex-shrink-0">
        <TypographySpanSmall className="block sm:inline">{label}</TypographySpanSmall>
        {labelSuffix && (
          <TypographySpanSmallMuted className="block sm:inline ml-0 sm:ml-2 mt-1 sm:mt-0">
            {labelSuffix}
          </TypographySpanSmallMuted>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{actions}</div>
    </div>
  )
}

