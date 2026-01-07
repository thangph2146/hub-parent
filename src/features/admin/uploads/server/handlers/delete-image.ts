/**
 * Delete Image Handler
 * Handler để xóa hình ảnh
 */

import { NextRequest } from "next/server"
import type { ApiRouteContext } from "@/lib/api/types"
import { getUserId } from "@/lib/api/api-route-helpers"
import { createSuccessResponse, createErrorResponse } from "@/lib/config"
import { deleteFile, IMAGES_DIR, STORAGE_DIR } from "@/lib/utils/file-utils"
import { promises as fs } from "fs"
import { logger } from "@/lib/config/logger"
import { resolveAndValidateFilePath } from "../utils/path-validation"

export const deleteImageHandler = async (req: NextRequest, context: ApiRouteContext) => {
  const userId = getUserId(context)
  const { searchParams } = new URL(req.url)
  const relativePath = searchParams.get("path")

  logger.info("Delete image request received", {
    userId,
    relativePath,
  })

  if (!relativePath) {
    logger.warn("Delete failed: Missing path parameter", { userId })
    return createErrorResponse("Thiếu tham số path", { status: 400 })
  }

  try {
    const validation = resolveAndValidateFilePath(relativePath, IMAGES_DIR, STORAGE_DIR, userId)
    if (!validation.valid) {
      return createErrorResponse(validation.error, { status: 403 })
    }

    const filePath = validation.filePath!
    const baseDir = validation.baseDir!

    logger.debug("Resolved file path for deletion", {
      relativePath,
      filePath,
      baseDir,
    })

    try {
      await fs.access(filePath)
      logger.debug("File exists, proceeding with deletion", { filePath })
    } catch {
      logger.warn("Delete failed: File not found", { userId, filePath })
      return createErrorResponse("File không tồn tại", { status: 404 })
    }

    await deleteFile(filePath)

    logger.success("Image deleted successfully", {
      userId,
      filePath,
      relativePath,
    })

    return createSuccessResponse(undefined, { message: "Xóa hình ảnh thành công" })
  } catch (error) {
    logger.error("Error deleting image", {
      userId,
      relativePath,
      error: error instanceof Error ? error : new Error(String(error)),
    })

    return createErrorResponse("Đã xảy ra lỗi khi xóa hình ảnh", { status: 500 })
  }
}

