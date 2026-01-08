/**
 * Upload Image Handler
 * Handler để upload hình ảnh
 */

import { NextRequest } from "next/server"
import type { ApiRouteContext } from "@/lib/api/types"
import { getUserId } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import {
  ensureDirectoryExists,
  generateUniqueFileName,
  generateFilePath,
  isValidImageFile,
  isValidFileSize,
  validateImageDimensions,
  initializeStorageDirectories,
} from "@/lib/utils/file-utils"
import { promises as fs } from "fs"
import path from "path"
import { logger } from "@/lib/config/logger"

export const uploadImageHandler = async (
  req: NextRequest,
  context: ApiRouteContext,
  formData?: FormData
) => {
  const userId = getUserId(context)

  logger.info("Upload request received", {
    userId,
    timestamp: new Date().toISOString(),
  })

  try {
    // Đảm bảo storage directories được tạo trước khi upload
    logger.debug("Initializing storage directories")
    await initializeStorageDirectories()
    logger.success("Storage directories initialized")

    // Nếu FormData chưa được đọc, đọc từ request
    const data = formData || (await req.formData())
    const file = data.get("file") as File | null
    const folderPath = data.get("folderPath") as string | null
    const isExistingFolderParam = data.get("isExistingFolder") as string | null
    const isExistingFolder = isExistingFolderParam === "true"

    if (!file) {
      logger.warn("Upload failed: No file provided", { userId })
      return createErrorResponse("Không có file được tải lên", { status: 400 })
    }

    logger.info("Upload with folder path", {
      userId,
      folderPath: folderPath || "default (date-based)",
      isExistingFolder,
    })

    logger.info("File received", {
      userId,
      originalName: file.name,
      size: file.size,
      type: file.type,
    })

    // Validate file type
    logger.debug("Validating file type", { fileName: file.name, mimeType: file.type })
    if (!isValidImageFile(file.name, file.type)) {
      logger.warn("Upload failed: Invalid file type", {
        userId,
        fileName: file.name,
        mimeType: file.type,
      })
      return createErrorResponse(
        "Chỉ cho phép upload file hình ảnh (jpg, jpeg, png, gif, webp, svg)",
        { status: 400 }
      )
    }
    logger.success("File type validated", { fileName: file.name })

    // Validate file size (max 10MB)
    logger.debug("Validating file size", { size: file.size, maxSizeMB: 10 })
    if (!isValidFileSize(file.size, 10)) {
      logger.warn("Upload failed: File too large", {
        userId,
        fileName: file.name,
        size: file.size,
      })
      return createErrorResponse("File quá lớn. Kích thước tối đa là 10MB", { status: 400 })
    }
    logger.success("File size validated", { size: `${(file.size / 1024 / 1024).toFixed(2)} MB` })

    // Validate image dimensions (max 1920px)
    logger.debug("Validating image dimensions", { maxDimension: 1920 })
    const dimensionCheck = await validateImageDimensions(file, 1920)
    if (!dimensionCheck.valid) {
      logger.warn("Upload failed: Invalid image dimensions", {
        userId,
        fileName: file.name,
        error: dimensionCheck.error,
      })
      return createErrorResponse(
        dimensionCheck.error || "Kích thước hình ảnh không hợp lệ",
        { status: 400 }
      )
    }
    logger.success("Image dimensions validated")

    // Generate unique file name
    logger.debug("Generating unique file name")
    const uniqueFileName = generateUniqueFileName(file.name)
    const { relativePath, fullPath, urlPath } = generateFilePath(
      uniqueFileName,
      folderPath || undefined,
      isExistingFolder
    )
    logger.info("File path generated", {
      uniqueFileName,
      folderPath: folderPath || "default (date-based)",
      relativePath,
      fullPath,
      urlPath,
    })

    // Ensure directory exists
    const dirPath = path.dirname(fullPath)
    logger.debug("Ensuring directory exists", { dirPath })
    await ensureDirectoryExists(dirPath)
    logger.success("Directory ensured", { dirPath })

    // Convert File to Buffer
    logger.debug("Converting file to buffer", { size: file.size })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    logger.success("File converted to buffer", { bufferSize: buffer.length })

    // Write file to disk
    logger.debug("Writing file to disk", { 
      fullPath, 
      resolvedPath: path.resolve(fullPath),
      cwd: process.cwd() 
    })
    await fs.writeFile(fullPath, buffer)
    
    // Verify file was actually written
    try {
      await fs.access(fullPath)
      logger.success("File verified on disk after write", { fullPath })
    } catch (err) {
      logger.error("File NOT found on disk immediately after write!", { 
        fullPath,
        error: err instanceof Error ? err.message : String(err)
      })
    }
    
    logger.success("Image uploaded successfully", {
      userId,
      originalFileName: file.name,
      uniqueFileName,
      relativePath,
      fullPath,
      urlPath,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
      mimeType: file.type,
    })

    return createSuccessResponse({
      fileName: uniqueFileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      url: urlPath,
      relativePath,
    }, { message: "Upload hình ảnh thành công" })
  } catch (error) {
    logger.error("Error uploading image", {
      userId,
      error: error instanceof Error ? error : new Error(String(error)),
    })

    return createErrorResponse("Đã xảy ra lỗi khi upload hình ảnh", { status: 500 })
  }
}

