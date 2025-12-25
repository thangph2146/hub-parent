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
  <Flex direction="col-sm-row" align="start" justify="between" gap={3} fullWidth className="sm:items-center">
      <Flex direction="col" gap={1}>
        <TypographySpanSmall className="block sm:inline">{label}</TypographySpanSmall>
      {labelSuffix && <TypographySpanSmallMuted className="block sm:inline">{labelSuffix}</TypographySpanSmallMuted>}
      </Flex>
    <Flex align="center" gap={2} wrap className="w-full sm:w-auto sm:flex-nowrap" shrink>
        {actions}
      </Flex>
    </Flex>
  )

