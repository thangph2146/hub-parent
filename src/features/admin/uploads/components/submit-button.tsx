/**
 * Submit Button Component
 * Button component với loading state cho form submissions
 */

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { IconSize } from "@/components/ui/typography"

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  isLoading: boolean
  loadingText?: string
}

export const SubmitButton = ({
  isLoading,
  disabled,
  children,
  loadingText,
  ...props
}: SubmitButtonProps) => {
  return (
    <Button {...props} disabled={disabled || isLoading}>
      {isLoading && (
        <IconSize size="sm" className="mr-2">
          <Loader2 className="animate-spin" />
        </IconSize>
      )}
      {isLoading && loadingText ? loadingText : children}
    </Button>
  )
}

