/**
 * Image Field Component
 * Follows Shadcn accessibility patterns
 */
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { FieldContent, FieldError } from "@/components/ui/field"
import { ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { TypographySpanMuted, TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

export interface ImageFieldProps {
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
  error?: string
  disabled?: boolean
  readOnly?: boolean
  fieldId?: string
}

export const ImageField = ({
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  error,
  disabled = false,
  readOnly = false,
  fieldId = "image",
}: ImageFieldProps) => {
  const imageUrl = typeof value === "string" ? value : ""
  const hasImage = imageUrl && imageUrl.trim() !== ""
  const [imageError, setImageError] = useState(false)
  const errorId = error ? `${fieldId}-error` : undefined
  const isDisabled = disabled
  const isReadOnly = readOnly && !isDisabled

  return (
    <FieldContent>
      <Flex direction="col" gap={4}>
        <Flex align="center" gap={2} fullWidth>
          <Input
            id={fieldId}
            type="text"
            value={imageUrl}
            onChange={(e) => {
              onChange(e.target.value)
              setImageError(false)
            }}
            placeholder={placeholder}
            className={cn(
              "flex-1 min-w-0",
              error && "border-destructive",
              isReadOnly && "!opacity-100 disabled:!opacity-100 [&:read-only]:!opacity-100 cursor-default bg-muted/50 border-muted-foreground/20",
              isDisabled && !isReadOnly && "!opacity-100"
            )}
            disabled={isDisabled && !isReadOnly}
            readOnly={isReadOnly}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={errorId}
          />
          {hasImage && !isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                onChange("")
                setImageError(false)
              }}
              className="shrink-0 disabled:!opacity-100"
              disabled={isDisabled}
              aria-label="Xóa hình ảnh"
            >
              <IconSize size="sm">
                <X />
              </IconSize>
            </Button>
          )}
        </Flex>

        {/* Image preview */}
        {hasImage && !imageError && (
          <Flex align="center" justify="center" fullWidth position="relative" className="aspect-video">
            <Image
              src={imageUrl}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          </Flex>
        )}

        {/* Error state */}
        {hasImage && imageError && (
          <Flex direction="col" align="center" gap={2} fullWidth position="relative" rounded="lg" border="all" overflow="hidden" bg="destructive-text" className="border-destructive/50 aspect-video text-destructive" padding="md">
            <IconSize size="2xl">
              <ImageIcon />
            </IconSize>
            <TypographySpanMuted>Không thể tải hình ảnh</TypographySpanMuted>
            <TypographySpanSmallMuted>Vui lòng kiểm tra lại URL</TypographySpanSmallMuted>
          </Flex>
        )}

        {/* Placeholder when no image */}
        {!hasImage && (
          <Flex direction="col" align="center" justify="center" gap={2} fullWidth position="relative" rounded="lg" border="all" overflow="hidden" bg="muted-50" className="border-dashed aspect-video text-muted-foreground">
            <IconSize size="4xl">
              <ImageIcon />
            </IconSize>
            <TypographySpanMuted>Chưa có hình ảnh</TypographySpanMuted>
          </Flex>
        )}

        {error && <FieldError id={errorId}>{error}</FieldError>}
      </Flex>
    </FieldContent>
  )
}

