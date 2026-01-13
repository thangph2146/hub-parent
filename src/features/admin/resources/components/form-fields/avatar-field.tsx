/**
 * Avatar Field Component
 * Follows Shadcn accessibility patterns
 */
"use client"

import * as React from "react"
import { FieldContent, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, X, Copy, Check } from "lucide-react"
import { cn } from "@/utils"
import { TypographyH4, TypographyPMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserInitials } from "@/features/admin/resources/utils"
import { logger } from "@/utils"

export interface AvatarFieldProps {
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  readOnly?: boolean
  fieldId?: string
}

export const AvatarField = ({
  value,
  onChange,
  placeholder = "https://example.com/avatar.jpg",
  error,
  disabled = false,
  readOnly = false,
  fieldId = "avatar",
}: AvatarFieldProps) => {
  const avatarUrl = typeof value === "string" ? value : ""
  const hasAvatar = avatarUrl && avatarUrl.trim() !== ""
  const [imageError, setImageError] = React.useState(false)
  const [name, setName] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled
  const isReadOnly = readOnly && !isDisabled

  const handleCopyUrl = async () => {
    if (!avatarUrl) return
    try {
      await navigator.clipboard.writeText(avatarUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logger.error("Failed to copy URL", err instanceof Error ? err : new Error(String(err)))
    }
  }

  // Get name from form input when it changes
  React.useEffect(() => {
    const updateName = () => {
      const nameInput = document.querySelector<HTMLInputElement>('input[name="name"]')
      if (nameInput) {
        setName(nameInput.value || "")
      }
    }
    updateName()
    const interval = setInterval(updateName, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <FieldContent>
      <Flex direction="col" gap={6}>
        <Card className={cn(
          "overflow-hidden border-2 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm",
          isReadOnly && "opacity-100",
          isDisabled && !isReadOnly && "opacity-100"
        )}>
          <Flex direction="col" align="start" gap={6} padding="lg" fullWidth className="sm:flex-row">
            <Flex position="relative" className="group">
              <Flex position="absolute" className="-inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Avatar className="relative h-28 w-28 border-4 border-background shadow-lg ring-2 ring-primary/10">
                <AvatarImage
                  src={hasAvatar && !imageError ? avatarUrl : undefined}
                  alt={name || "Avatar"}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
                <AvatarFallback asChild>
                  <TypographyH4 className="bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground">
                    {getUserInitials(name, "")}
                  </TypographyH4>
                </AvatarFallback>
              </Avatar>
              {hasAvatar && !imageError && (
                <Flex align="center" justify="center" position="absolute" className="-bottom-1 -right-1 h-7 w-7 rounded-full bg-green-500 border-[3px] border-background shadow-md">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </Flex>
              )}
            </Flex>
            <Flex direction="col" gap={4} flex="1" minWidth="0" fullWidth>
              <Flex direction="col" gap={2}>
                <Input
                  id={fieldId}
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => {
                    onChange(e.target.value)
                    setImageError(false)
                  }}
                  placeholder={placeholder}
                  className={cn(
                    "w-full",
                    error && "border-destructive",
                    isReadOnly && "!opacity-100 disabled:!opacity-100 [&:read-only]:!opacity-100 cursor-default bg-muted border-muted-foreground/20",
                    isDisabled && !isReadOnly && "!opacity-100 bg-muted/50 border-muted-foreground/10"
                  )}
                  disabled={isDisabled && !isReadOnly}
                  readOnly={isReadOnly}
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={errorId}
                />
                {hasAvatar && !readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onChange("")
                      setImageError(false)
                    }}
                    className="w-full sm:w-auto disabled:!opacity-100"
                    disabled={isDisabled}
                    aria-label="Xóa ảnh đại diện"
                  >
                    <IconSize size="sm" className="mr-2">
                      <X />
                    </IconSize>
                    Xóa ảnh đại diện
                  </Button>
                )}
              </Flex>
              {readOnly && hasAvatar ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleCopyUrl}
                  disabled={!hasAvatar}
                  className="w-full sm:w-fit"
                >
                  <IconSize size="sm" className="mr-2">
                    {copied ? <Check /> : <Copy />}
                  </IconSize>
                  {copied ? "Đã copy!" : "Copy URL"}
                </Button>
              ) : (
                <TypographyPMuted className={cn(isReadOnly && "!opacity-100")}>
                  Nhập URL của ảnh đại diện hoặc để trống để sử dụng chữ cái đầu
                </TypographyPMuted>
              )}
            </Flex>
          </Flex>
        </Card>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </Flex>
    </FieldContent>
  )
}
