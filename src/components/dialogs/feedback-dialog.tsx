"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flex } from "@/components/ui/flex"
import { TypographyH3, TypographyP, TypographyPSmall, IconSize } from "@/components/ui/typography"

export type FeedbackVariant = "success" | "error"

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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <DialogPrimitive.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 shadow-lg focus:outline-hidden">
          <Flex align="start" gap={3}>
            <IconSize size="lg" className={iconColor}>
              <Icon />
            </IconSize>
            <Flex direction="col" flex="1">
              <DialogPrimitive.Title asChild>
                <TypographyH3>{title}</TypographyH3>
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description asChild>
                  <TypographyP>{description}</TypographyP>
                </DialogPrimitive.Description>
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

