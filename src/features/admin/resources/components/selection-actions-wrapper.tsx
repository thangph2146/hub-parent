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
}: SelectionActionsWrapperProps) => (
  <Flex direction="col" align="start" justify="between" gap={3} fullWidth className="sm:flex-row sm:items-center">
    <Flex direction="col" gap={1} fullWidth flex="1" minWidth="0">
      <TypographySpanSmall className="block sm:inline">{label}</TypographySpanSmall>
      {labelSuffix && <TypographySpanSmallMuted className="block sm:inline">{labelSuffix}</TypographySpanSmallMuted>}
    </Flex>
    <Flex align="center" gap={2} wrap shrink className="w-full sm:w-auto sm:flex-nowrap">
      {actions}
    </Flex>
  </Flex>
)

