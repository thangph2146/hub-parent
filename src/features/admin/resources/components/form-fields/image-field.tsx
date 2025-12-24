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
  fieldId?: string
}

export const ImageField = ({
  value,
  onChange,
  placeholder = "https://example.com/image.jpg",
  error,
  disabled = false,
  fieldId = "image",
}: ImageFieldProps) => {
  const imageUrl = typeof value === "string" ? value : ""
  const hasImage = imageUrl && imageUrl.trim() !== ""
  const [imageError, setImageError] = useState(false)
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <FieldContent>
      <Flex direction="col" gap={4}>
        <Flex gap={2}>
          <Input
            id={fieldId}
            type="text"
            value={imageUrl}
            onChange={(e) => {
              onChange(e.target.value)
              setImageError(false)
            }}
            placeholder={placeholder}
            className={cn("flex-1", error && "border-destructive")}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={errorId}
          />
          {hasImage && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                onChange("")
                setImageError(false)
              }}
              className="shrink-0"
              disabled={disabled}
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
          <Flex align="center" justify="center" className="aspect-video w-full relative">
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
          <div className="relative w-full rounded-lg border border-destructive/50 overflow-hidden bg-destructive/5">
            <Flex direction="col" align="center" justify="center" className="aspect-video w-full gap-2 p-4 text-destructive">
              <IconSize size="2xl">
                <ImageIcon />
              </IconSize>
              <TypographySpanMuted>Không thể tải hình ảnh</TypographySpanMuted>
              <TypographySpanSmallMuted>Vui lòng kiểm tra lại URL</TypographySpanSmallMuted>
            </Flex>
          </div>
        )}

        {/* Placeholder when no image */}
        {!hasImage && (
          <div className="relative w-full rounded-lg border border-dashed border-border overflow-hidden bg-muted/30">
            <Flex direction="col" align="center" justify="center" className="aspect-video w-full gap-2 text-muted-foreground">
              <IconSize size="4xl">
                <ImageIcon />
              </IconSize>
              <TypographySpanMuted>Chưa có hình ảnh</TypographySpanMuted>
            </Flex>
          </div>
        )}

        {error && <FieldError id={errorId}>{error}</FieldError>}
      </Flex>
    </FieldContent>
  )
}

