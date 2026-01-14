"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flex } from "@/components/ui/flex"
import { TypographyH3, TypographyP, TypographyPSmall, IconSize } from "@/components/ui/typography"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

export type FeedbackVariant = "info" | "success" | "error"

export interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: FeedbackVariant
  title: string
  description?: string
  details?: string
}

export function FeedbackDialog({
  open,
  onOpenChange,
  variant,
  title,
  description,
  details,
}: FeedbackDialogProps) {
  const Icon = variant === "success" ? CheckCircle2 : XCircle
  const iconColor = variant === "success" ? "text-emerald-500" : "text-rose-500"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
        <Flex align="start" gap={3}>
          <IconSize size="lg" className={iconColor}>
            <Icon />
          </IconSize>
          <Flex direction="col" flex="1">
            <DialogTitle asChild>
              <TypographyH3>{title}</TypographyH3>
            </DialogTitle>
            {description ? (
              <DialogDescription asChild>
                <TypographyP>{description}</TypographyP>
              </DialogDescription>
            ) : null}
          </Flex>
        </Flex>

        {details ? (
          <Flex direction="col" gap={2} className="mt-4">
            <TypographyP>
              Chi tiết
            </TypographyP>
            <ScrollArea className="max-h-48 rounded-md border border-border/60 bg-muted/30 p-3">
              <TypographyPSmall className="whitespace-pre-wrap break-words">{details}</TypographyPSmall>
            </ScrollArea>
          </Flex>
        ) : null}

        <Flex justify="end" gap={6}>
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </Flex>
      </DialogContent>
    </Dialog>
  )
}

