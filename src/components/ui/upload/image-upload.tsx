"use client"

/**
 * Image Upload Component
 * Component để upload hình ảnh với preview và drag & drop
 */

import * as React from "react"
import NextImage from "next/image"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { cn } from "@/utils"
import { apiClient } from "@/services/api/axios"
import { apiRoutes } from "@/constants"
import { logger } from "@/utils"
import { TypographyP, TypographyPSmallMuted, TypographyPMuted, IconSize } from "@/components/ui/typography"
import type { UploadResponse, UploadError } from "@/features/admin/uploads/types"
import { useToast } from "@/hooks"

export interface ImageUploadProps {
  /** Callback khi upload thành công */
  onUploadSuccess?: (data: UploadResponse["data"]) => void
  /** Callback khi upload thất bại */
  onUploadError?: (error: string) => void
  /** URL hình ảnh hiện tại (để preview) */
  currentImageUrl?: string | null
  /** Cho phép xóa hình ảnh */
  onRemove?: () => void
  /** Class name cho container */
  className?: string
  /** Label cho input */
  label?: string
  /** Kích thước tối đa (MB) */
  maxSizeMB?: number
  /** Kích thước tối đa của hình ảnh (px) - mặc định 500px */
  maxDimension?: number
  /** Disabled state */
  disabled?: boolean
}

/**
 * Resize image nếu vượt quá maxDimension
 */
function resizeImage(file: File, maxDimension: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const width = img.width
        const height = img.height

        // Kiểm tra xem có cần resize không
        if (width <= maxDimension && height <= maxDimension) {
          resolve(file)
          return
        }

        // Tính toán kích thước mới giữ nguyên tỷ lệ
        let newWidth = width
        let newHeight = height

        if (width > height) {
          if (width > maxDimension) {
            newWidth = maxDimension
            newHeight = Math.round((height * maxDimension) / width)
          }
        } else {
          if (height > maxDimension) {
            newHeight = maxDimension
            newWidth = Math.round((width * maxDimension) / height)
          }
        }

        // Tạo canvas để resize
        const canvas = document.createElement("canvas")
        canvas.width = newWidth
        canvas.height = newHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Không thể tạo canvas context"))
          return
        }

        // Vẽ hình ảnh đã resize
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // Convert canvas thành blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Không thể resize hình ảnh"))
              return
            }

            // Tạo File mới từ blob
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          },
          file.type,
          0.9 // Quality
        )
      }
      img.onerror = () => reject(new Error("Không thể load hình ảnh"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Không thể đọc file"))
    reader.readAsDataURL(file)
  })
}

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  currentImageUrl,
  onRemove,
  className,
  label = "Upload hình ảnh",
  maxSizeMB = 10,
  maxDimension = 500,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentImageUrl || null)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Update preview khi currentImageUrl thay đổi
  React.useEffect(() => {
    setPreviewUrl(currentImageUrl || null)
  }, [currentImageUrl])

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!validTypes.includes(file.type)) {
      const errorMsg = "Chỉ cho phép upload file hình ảnh (jpg, jpeg, png, gif, webp, svg)"
      setError(errorMsg)
      onUploadError?.(errorMsg)
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      const errorMsg = `File quá lớn. Kích thước tối đa là ${maxSizeMB}MB`
      setError(errorMsg)
      onUploadError?.(errorMsg)
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      })
      return
    }

    // Upload file
    setIsUploading(true)
    setError(null)

    try {
      // Resize image nếu cần (bỏ qua SVG vì không thể resize)
      let fileToUpload = file
      if (file.type !== "image/svg+xml") {
        try {
          fileToUpload = await resizeImage(file, maxDimension)
        } catch (resizeError) {
          logger.warn("Không thể resize hình ảnh, upload bản gốc", { error: resizeError })
          // Nếu resize thất bại, vẫn upload file gốc
        }
      }

      // Create preview từ file đã resize
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(fileToUpload)

      const formData = new FormData()
      formData.append("file", fileToUpload)

      const response = await apiClient.post<UploadResponse>(
        apiRoutes.uploads.upload,
        formData
      )

      if (!response.data.success || !response.data.data) {
        const errorData = response.data as unknown as UploadError
        throw new Error(errorData.error || "Upload thất bại")
      }

      setPreviewUrl(response.data.data.url)
      onUploadSuccess?.(response.data.data)
      toast({
        title: "Thành công",
        description: "Upload hình ảnh thành công",
      })
    } catch (err) {
      let errorMsg = "Đã xảy ra lỗi khi upload"
      
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: UploadError } }
        errorMsg = axiosError.response?.data?.error || errorMsg
      } else if (err instanceof Error) {
        errorMsg = err.message
      }

      setError(errorMsg)
      onUploadError?.(errorMsg)
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input để có thể chọn lại file cùng tên
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onRemove?.()
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-2 block"><TypographyP>{label}</TypographyP></label>
      )}
      
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors",
          isDragging && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="relative p-4">
            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-muted">
              <NextImage
                src={previewUrl}
                alt="Preview"
                title="Preview"
                fill
                className="object-contain article-image article-image-ux-impr article-image-new expandable"
                unoptimized
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <IconSize size="sm"><X /></IconSize>
                </Button>
              )}
            </div>
            {isUploading && (
              <Flex align="center" justify="center" className="absolute inset-0 bg-background/80 rounded-md">
                <IconSize size="2xl" className="animate-spin text-primary"><Loader2 /></IconSize>
              </Flex>
            )}
          </div>
        ) : (
          <Flex
            direction="col"
            align="center"
            justify="center"
            gap={4}
            className={cn(
              "p-8 cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
            onClick={handleClick}
          >
            {isUploading ? (
              <Flex direction="col" align="center" gap={2}>
                <IconSize size="4xl" className="animate-spin text-primary">
                  <Loader2 />
                </IconSize>
                <TypographyPMuted>Đang upload...</TypographyPMuted>
              </Flex>
            ) : (
              <Flex direction="col" align="center" gap={2}>
                <Flex align="center" justify="center" className="rounded-full bg-muted p-4">
                  <IconSize size="2xl" className="text-muted-foreground"><Upload /></IconSize>
                </Flex>
                <TypographyP>
                  Kéo thả hình ảnh vào đây hoặc click để chọn
                </TypographyP>
                <TypographyPSmallMuted>
                  JPG, PNG, GIF, WEBP, SVG (tối đa {maxSizeMB}MB)
                </TypographyPSmallMuted>
              </Flex>
            )}
          </Flex>
        )}

        {error && (
          <div className="px-4 pb-4">
            <TypographyP className="text-destructive">{error}</TypographyP>
          </div>
        )}
      </div>

      {!previewUrl && !isUploading && (
        <Flex align="center" gap={2} className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm"><ImageIcon /></IconSize>
              <span>Chọn hình ảnh</span>
            </Flex>
          </Button>
        </Flex>
      )}
    </div>
  )
}


