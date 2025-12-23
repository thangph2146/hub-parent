"use client"

import { useCallback, useRef, useEffect, useMemo } from "react"
import { FieldContent, FieldError } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageIcon, X, Star, ArrowUp, ArrowDown } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { MultipleImageUpload } from "@/components/forms"
import type { UploadResponse } from "@/features/admin/uploads/types"
import { logger } from "@/lib/config/logger"
import { TypographyPSmall, TypographyPSmallMuted, TypographyPMuted, IconSize } from "@/components/ui/typography"

export interface ProductImage {
  url: string
  alt?: string | null
  order?: number
  isPrimary?: boolean
  id?: string // Temporary ID for new images
}

export interface MultipleImagesFieldProps {
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
}

const ImageItem = ({
  image,
  index,
  total,
  onRemove,
  onSetPrimary,
  onAltChange,
  onMoveUp,
  onMoveDown,
  disabled,
}: {
  image: ProductImage
  index: number
  total: number
  onRemove: () => void
  onSetPrimary: () => void
  onAltChange: (alt: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  disabled?: boolean
}) => {
  return (
    <div
      className={cn(
        "group relative border rounded-lg overflow-hidden bg-muted/30",
        image.isPrimary && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="aspect-square relative">
        <Image
          src={image.url}
          alt={image.alt || `Image ${index + 1}`}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={onMoveUp}
              disabled={disabled || index === 0}
              title="Di chuyển lên"
            >
              <IconSize size="sm">
                <ArrowUp />
              </IconSize>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={onMoveDown}
              disabled={disabled || index === total - 1}
              title="Di chuyển xuống"
            >
              <IconSize size="sm">
                <ArrowDown />
              </IconSize>
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="opacity-0 group-hover:opacity-100 p-2 bg-white/90 hover:bg-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSetPrimary}
            disabled={disabled || image.isPrimary}
            title={image.isPrimary ? "Ảnh chính" : "Đặt làm ảnh chính"}
          >
            <IconSize size="sm" className={cn(image.isPrimary ? "fill-yellow-400 text-yellow-400" : "text-gray-700")}>
              <Star />
            </IconSize>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="opacity-0 group-hover:opacity-100 p-2 bg-white/90 hover:bg-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onRemove}
            disabled={disabled}
            title="Xóa ảnh"
          >
            <IconSize size="sm" className="text-destructive">
              <X />
            </IconSize>
          </Button>
        </div>
        {image.isPrimary && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded flex items-center gap-1">
            <IconSize size="xs" className="fill-current">
              <Star />
            </IconSize>
            <TypographyPSmall>Chính</TypographyPSmall>
          </div>
        )}
      </div>
      <div className="p-2">
        <Input
          type="text"
          value={image.alt || ""}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Mô tả ảnh (alt text)"
          className=""
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export const MultipleImagesField = ({ value, onChange, error, disabled = false }: MultipleImagesFieldProps) => {
  const { toast } = useToast()
  
  // Use ref to store latest value to avoid stale closure
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Parse images from value with stable IDs
  // Use index-based IDs for temp images to avoid ref access during render
  const images: ProductImage[] = useMemo(() => {
    if (!Array.isArray(value)) return []
    
    return value.map((img, index) => ({
      ...img,
      id: img.id || `temp-${index}`,
      order: img.order ?? index,
      isPrimary: img.isPrimary ?? false,
    }))
  }, [value])

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    logger.debug("📸 [MultipleImagesField] Di chuyển image lên", {
      fromIndex: index,
      toIndex: index - 1,
      imageUrl: images[index]?.url,
    })

    const newImages = [...images]
    ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
    const reordered = newImages.map((img, i) => ({ ...img, order: i }))
    onChange(reordered)
  }

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return
    logger.debug("📸 [MultipleImagesField] Di chuyển image xuống", {
      fromIndex: index,
      toIndex: index + 1,
      imageUrl: images[index]?.url,
    })

    const newImages = [...images]
    ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    const reordered = newImages.map((img, i) => ({ ...img, order: i }))
    onChange(reordered)
  }

  const handleUploadSuccess = useCallback(
    (data: UploadResponse["data"]) => {
      if (!data?.url) return

      // Get latest value from ref to avoid stale closure
      const currentValue = valueRef.current
      const currentImages: ProductImage[] = Array.isArray(currentValue)
        ? currentValue.map((img, index) => ({
            ...img,
            id: img.id || `temp-${index}-${Date.now()}`,
            order: img.order ?? index,
            isPrimary: img.isPrimary ?? false,
          }))
        : []

      logger.info("📸 [MultipleImagesField] Upload image thành công", {
        url: data.url,
        currentImagesCount: currentImages.length,
        willBePrimary: currentImages.length === 0,
      })

      const newImage: ProductImage = {
        url: data.url,
        alt: "",
        order: currentImages.length,
        isPrimary: currentImages.length === 0, // First image is primary by default
        id: `temp-${Date.now()}-${Math.random()}`,
      }

      // If this is the first image, make it primary and unset others
      const updatedImages = currentImages.map((img) => ({
        ...img,
        isPrimary: false,
      }))

      const finalImages = [...updatedImages, newImage]
      
      // Update ref immediately
      valueRef.current = finalImages
      
      onChange(finalImages)

      logger.info("📸 [MultipleImagesField] Image đã được thêm vào form", {
        totalImages: finalImages.length,
        newImageUrl: data.url,
        isPrimary: newImage.isPrimary,
      })
    },
    [onChange]
  )

  const handleUploadError = useCallback(
    (error: string) => {
      toast({
        variant: "destructive",
        title: "Upload thất bại",
        description: error,
      })
    },
    [toast]
  )

  const handleRemove = (index: number) => {
    const removedImage = images[index]
    logger.info("📸 [MultipleImagesField] Xóa image", {
      index,
      imageUrl: removedImage?.url,
      wasPrimary: removedImage?.isPrimary,
      currentImagesCount: images.length,
    })

    const newImages = images.filter((_, i) => i !== index)
    // If removed image was primary, make first image primary
    if (removedImage?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true
      logger.info("📸 [MultipleImagesField] Đặt image đầu tiên làm primary sau khi xóa", {
        newPrimaryUrl: newImages[0].url,
      })
    }
    onChange(newImages.length > 0 ? newImages : [])
  }

  const handleSetPrimary = (index: number) => {
    const imageToSetPrimary = images[index]
    logger.info("📸 [MultipleImagesField] Đặt image làm primary", {
      index,
      imageUrl: imageToSetPrimary?.url,
      currentPrimaryIndex: images.findIndex((img) => img.isPrimary),
    })

    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }))
    onChange(newImages)
  }

  const handleAltChange = (index: number, alt: string) => {
    logger.debug("📸 [MultipleImagesField] Cập nhật alt text", {
      index,
      imageUrl: images[index]?.url,
      newAlt: alt,
    })

    const newImages = [...images]
    newImages[index] = { ...newImages[index], alt }
    onChange(newImages)
  }

  const handleAddByUrl = (url: string) => {
    if (!url.trim()) return

    // Get latest value from ref to avoid stale closure
    const currentValue = valueRef.current
    const currentImages: ProductImage[] = Array.isArray(currentValue)
      ? currentValue.map((img, index) => ({
          ...img,
          id: img.id || `temp-${index}-${Date.now()}`,
          order: img.order ?? index,
          isPrimary: img.isPrimary ?? false,
        }))
      : []

    logger.info("📸 [MultipleImagesField] Thêm image bằng URL", {
      url: url.trim(),
      currentImagesCount: currentImages.length,
      willBePrimary: currentImages.length === 0,
    })

    const newImage: ProductImage = {
      url: url.trim(),
      alt: "",
      order: currentImages.length,
      isPrimary: currentImages.length === 0,
      id: `temp-${Date.now()}-${Math.random()}`,
    }

    const updatedImages = currentImages.map((img) => ({
      ...img,
      isPrimary: false,
    }))

    const finalImages = [...updatedImages, newImage]
    
    // Update ref immediately
    valueRef.current = finalImages
    
    onChange(finalImages)

    logger.info("📸 [MultipleImagesField] Image từ URL đã được thêm vào form", {
      totalImages: finalImages.length,
      newImageUrl: url.trim(),
      isPrimary: newImage.isPrimary,
    })
  }

  return (
    <FieldContent>
      <div className="space-y-4">
        {/* Upload controls */}
        <div className="space-y-4">
          <MultipleImageUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            label="Upload hình ảnh"
            maxSizeMB={5}
            maxDimension={500}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Hoặc nhập URL ảnh"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddByUrl(e.currentTarget.value)
                  e.currentTarget.value = ""
                }
              }}
              disabled={disabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                if (input) {
                  handleAddByUrl(input.value)
                  input.value = ""
                }
              }}
              disabled={disabled}
            >
              Thêm URL
            </Button>
          </div>
        </div>

        {/* Images grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 -4">
            {images.map((image, index) => (
              <ImageItem
                key={image.id || image.url}
                image={image}
                index={index}
                total={images.length}
                onRemove={() => handleRemove(index)}
                onSetPrimary={() => handleSetPrimary(index)}
                onAltChange={(alt) => handleAltChange(index, alt)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                disabled={disabled}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <IconSize size="4xl" className="mx-auto text-muted-foreground mb-2">
              <ImageIcon />
            </IconSize>
            <TypographyPMuted>Chưa có hình ảnh nào</TypographyPMuted>
            <TypographyPSmallMuted className="mt-1">Upload hoặc thêm URL để bắt đầu</TypographyPSmallMuted>
          </div>
        )}

        {/* Error message */}
        {error && <FieldError>{error}</FieldError>}
      </div>
    </FieldContent>
  )
}

