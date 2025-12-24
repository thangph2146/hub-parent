import type { ReactNode } from "react"
import { TypographySpanSmall, TypographySpanSmallMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

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
    <Flex direction="col" align="start" justify="between" gap={3} className="w-full sm:flex-row sm:items-center">
      <Flex direction="col" gap={1}>
        <TypographySpanSmall className="block sm:inline">{label}</TypographySpanSmall>
        {labelSuffix && (
          <TypographySpanSmallMuted className="block sm:inline sm:ml-0">
            {labelSuffix}
          </TypographySpanSmallMuted>
        )}
      </Flex>
      <Flex align="center" gap={2} className="w-full sm:w-auto flex-wrap sm:flex-nowrap shrink-0">
        {actions}
      </Flex>
    </Flex>
  )
}

