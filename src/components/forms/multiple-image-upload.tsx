"use client"

/**
 * Multiple Image Upload Component
 * Component để upload nhiều hình ảnh cùng lúc với progress và auto-compress
 */

import * as React from "react"
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/index"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { logger } from "@/lib/config"
import { TypographyP, TypographyPSmall, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import type { UploadResponse, UploadError } from "@/features/admin/uploads/types"
import { useToast } from "@/hooks/use-toast"

// Simple Progress component
function UploadProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}>
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

export interface UploadItem {
  id: string
  file: File
  preview?: string
  status: "pending" | "processing" | "uploading" | "success" | "error"
  progress: number
  result?: UploadResponse["data"]
  error?: string
}

export interface MultipleImageUploadProps {
  /** Callback khi upload thành công (cho mỗi file) */
  onUploadSuccess?: (data: UploadResponse["data"]) => void
  /** Callback khi upload thất bại */
  onUploadError?: (error: string, file: File) => void
  /** Class name cho container */
  className?: string
  /** Label cho input */
  label?: string
  /** Kích thước tối đa mỗi file (MB) - mặc định 5MB */
  maxSizeMB?: number
  /** Kích thước tối đa của hình ảnh (px) - mặc định 500px */
  maxDimension?: number
  /** Disabled state */
  disabled?: boolean
  /** Folder path để lưu file (relative to IMAGES_DIR), nếu không có sẽ dùng date-based folder */
  folderPath?: string | null
  /** true nếu là folder có sẵn (chọn từ dropdown), false nếu là folder mới tạo */
  isExistingFolder?: boolean
}

/**
 * Compress image để giảm file size xuống dưới maxSizeMB
 */
async function compressImage(
  file: File,
  maxSizeMB: number,
  maxDimension: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    // SVG không thể compress
    if (file.type === "image/svg+xml") {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024
        let width = img.width
        let height = img.height

        // Resize nếu vượt quá maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            width = maxDimension
            height = Math.round((img.height * maxDimension) / img.width)
          } else {
            height = maxDimension
            width = Math.round((img.width * maxDimension) / img.height)
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Không thể tạo canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Compress với quality giảm dần cho đến khi đạt maxSizeMB
        const compress = (quality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Không thể compress hình ảnh"))
                return
              }

              if (blob.size <= maxSizeBytes || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type === "image/png" ? "image/jpeg" : file.type,
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                // Giảm quality và thử lại
                compress(Math.max(0.1, quality - 0.1))
              }
            },
            file.type === "image/png" ? "image/jpeg" : file.type,
            quality
          )
        }

        // Bắt đầu với quality 0.9
        compress(0.9)
      }
      img.onerror = () => reject(new Error("Không thể load hình ảnh"))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error("Không thể đọc file"))
    reader.readAsDataURL(file)
  })
}

export function MultipleImageUpload({
  onUploadSuccess,
  onUploadError,
  className,
  label = "Upload hình ảnh",
  maxSizeMB = 5,
  maxDimension = 500,
  disabled = false,
  folderPath,
  isExistingFolder = false,
}: MultipleImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadItems, setUploadItems] = React.useState<UploadItem[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const processFiles = React.useCallback(
    async (files: FileList | File[]) => {
      logger.info("Processing files for upload", {
        fileCount: files.length,
      })
      const fileArray = Array.from(files)
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]

      // Filter valid files
      const validFiles = fileArray.filter((file) => {
        if (!validTypes.includes(file.type)) {
          logger.warn("Invalid file type rejected", {
            fileName: file.name,
            fileType: file.type,
          })
          toast({
            title: "Lỗi",
            description: `${file.name}: Chỉ cho phép file hình ảnh`,
            variant: "destructive",
          })
          return false
        }
        return true
      })

      logger.info("Valid files filtered", {
        total: fileArray.length,
        valid: validFiles.length,
      })

      if (validFiles.length === 0) return

      // Create upload items
      const newItems: UploadItem[] = await Promise.all(
        validFiles.map(async (file) => {
          const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })

          return {
            id,
            file,
            preview,
            status: "pending" as const,
            progress: 0,
          }
        })
      )

      setUploadItems((prev) => [...prev, ...newItems])
      setIsProcessing(true)

      // Process each file
      for (const item of newItems) {
        try {
          // Update status to processing
          setUploadItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i))
          )

          // Compress if needed
          let fileToUpload = item.file
          if (item.file.size > maxSizeMB * 1024 * 1024 && item.file.type !== "image/svg+xml") {
            fileToUpload = await compressImage(item.file, maxSizeMB, maxDimension)
          } else if (item.file.type !== "image/svg+xml") {
            // Resize if needed (dimension check)
            const img = new Image()
            const imgLoad = new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error("Cannot load image"))
              img.src = item.preview!
            })

            await imgLoad
            if (img.width > maxDimension || img.height > maxDimension) {
              fileToUpload = await compressImage(item.file, maxSizeMB, maxDimension)
            }
          }

          // Update status to uploading
          setUploadItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 10 } : i))
          )

          // Upload file
          const formData = new FormData()
          formData.append("file", fileToUpload)
          if (folderPath) {
            formData.append("folderPath", folderPath)
            formData.append("isExistingFolder", String(isExistingFolder))
          }

          logger.info("Starting file upload", {
            url: apiRoutes.uploads.upload,
            fileName: fileToUpload.name,
            originalName: item.file.name,
            size: fileToUpload.size,
            sizeMB: (fileToUpload.size / 1024 / 1024).toFixed(2),
            type: fileToUpload.type,
            itemId: item.id,
          })

          const response = await apiClient.post<UploadResponse>(apiRoutes.uploads.upload, formData, {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round(
                  10 + (progressEvent.loaded / progressEvent.total) * 90
                )
                logger.debug("Upload progress", {
                  itemId: item.id,
                  fileName: item.file.name,
                  progress,
                  loaded: progressEvent.loaded,
                  total: progressEvent.total,
                })
                setUploadItems((prev) =>
                  prev.map((i) => (i.id === item.id ? { ...i, progress } : i))
                )
              }
            },
          })

          logger.success("File upload completed", {
            itemId: item.id,
            fileName: item.file.name,
            response: response.data,
          })

          if (!response.data.success || !response.data.data) {
            logger.error("Upload failed - invalid response", {
              itemId: item.id,
              fileName: item.file.name,
              response: response.data,
            })
            throw new Error("Upload thất bại")
          }

          // Success
          setUploadItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: "success", progress: 100, result: response.data.data }
                : i
            )
          )

          onUploadSuccess?.(response.data.data)
        } catch (err) {
          logger.error("File upload error", {
            itemId: item.id,
            fileName: item.file.name,
            error: err instanceof Error ? err : new Error(String(err)),
          })

          if (err && typeof err === "object" && "response" in err) {
            const axiosError = err as { response?: { data?: UploadError; status?: number } }
            logger.warn("Upload API error details", {
              itemId: item.id,
              fileName: item.file.name,
              status: axiosError.response?.status,
              errorData: axiosError.response?.data,
            })
          }

          const errorMsg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: UploadError; status?: number } }).response?.data?.error ||
                `Upload thất bại (${(err as { response?: { status?: number } }).response?.status || "unknown"})`
              : err instanceof Error
                ? err.message
                : "Upload thất bại"

          setUploadItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: "error", error: errorMsg } : i
            )
          )

          onUploadError?.(errorMsg, item.file)
          toast({
            title: "Lỗi",
            description: `${item.file.name}: ${errorMsg}`,
            variant: "destructive",
          })
        }
      }

      setIsProcessing(false)
    },
    [maxSizeMB, maxDimension, onUploadSuccess, onUploadError, toast, folderPath, isExistingFolder]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
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

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemove = (id: string) => {
    setUploadItems((prev) => prev.filter((item) => item.id !== id))
  }

  const pendingCount = uploadItems.filter((i) => i.status === "pending" || i.status === "processing" || i.status === "uploading").length
  const successCount = uploadItems.filter((i) => i.status === "success").length

  return (
    <div className={cn("w-full space-y-4", className)}>
      {label && <label className="font-medium block"><TypographyP>{label}</TypographyP></label>}

      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors p-6",
          isDragging && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div
          className={cn(
            "flex flex-col items-center justify-center cursor-pointer",
            disabled && "cursor-not-allowed"
          )}
          onClick={handleClick}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <TypographyP className="font-medium mb-1">Đang xử lý {pendingCount} hình ảnh...</TypographyP>
              <TypographyPSmallMuted>
                {successCount} hình ảnh đã upload thành công
              </TypographyPSmallMuted>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-4 mb-4">
                <IconSize size="2xl" className="text-muted-foreground"><Upload /></IconSize>
              </div>
              <TypographyP className="font-medium mb-1">
                Kéo thả hình ảnh vào đây hoặc click để chọn
              </TypographyP>
              <TypographyPSmallMuted>
                JPG, PNG, GIF, WEBP, SVG (tối đa {maxSizeMB}MB mỗi file, tự động resize nếu cần)
              </TypographyPSmallMuted>
            </>
          )}
        </div>
      </div>

      {uploadItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <TypographyP className="font-medium">
              {uploadItems.length} hình ảnh ({successCount} thành công)
            </TypographyP>
            {uploadItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUploadItems([])}
                disabled={isProcessing}
              >
                Xóa tất cả
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {uploadItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                {item.preview && (
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <NextImage
                      src={item.preview}
                      alt={item.file.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypographyP className="font-medium truncate">{item.file.name}</TypographyP>
                    {item.status === "success" && (
                      <IconSize size="sm" className="text-green-500 flex-shrink-0"><CheckCircle2 /></IconSize>
                    )}
                    {item.status === "error" && (
                      <IconSize size="sm" className="text-destructive flex-shrink-0"><AlertCircle /></IconSize>
                    )}
                    {item.status === "processing" && (
                      <IconSize size="sm" className="animate-spin text-primary flex-shrink-0"><Loader2 /></IconSize>
                    )}
                    {item.status === "uploading" && (
                      <IconSize size="sm" className="animate-spin text-primary flex-shrink-0"><Loader2 /></IconSize>
                    )}
                  </div>

                  {(item.status === "uploading" || item.status === "processing") && (
                    <UploadProgress value={item.progress} className="h-1.5" />
                  )}

                  {item.status === "error" && item.error && (
                    <TypographyPSmall className="text-destructive mt-1">{item.error}</TypographyPSmall>
                  )}

                  {item.status === "success" && item.result && (
                    <TypographyPSmallMuted className="mt-1">
                      {(item.result.size / 1024).toFixed(1)} KB
                    </TypographyPSmallMuted>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 flex-shrink-0"
                  onClick={() => handleRemove(item.id)}
                  disabled={item.status === "uploading" || item.status === "processing"}
                >
                  <IconSize size="sm"><X /></IconSize>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

