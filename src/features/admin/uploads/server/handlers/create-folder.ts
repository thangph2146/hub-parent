/**
 * Create Folder Handler
 * Handler để tạo folder mới
 */

import { NextRequest } from "next/server"
import type { ApiRouteContext } from "@/types"
import { getUserId } from "@/lib"
import { createSuccessResponse, createErrorResponse } from "@/lib"
import { ensureDirectoryExists, initializeStorageDirectories } from "@/lib"
import { promises as fs } from "fs"
import { logger } from "@/utils"
import { sanitizeFolderName, resolveAndValidateFolderPath } from "../utils/path-validation"

export const createFolderHandler = async (
  req: NextRequest,
  context: ApiRouteContext,
  folderName: string | null,
  parentPath: string | null
) => {
  const userId = getUserId(context)

  logger.info("Create folder request received", {
    userId,
    folderName,
    parentPath: parentPath || "root",
  })

  if (!folderName || !folderName.trim()) {
    logger.warn("Create folder failed: Missing folder name", { userId })
    return createErrorResponse("Thiếu tên thư mục", { status: 400 })
  }

  const sanitizedFolderName = sanitizeFolderName(folderName)

  if (!sanitizedFolderName) {
    logger.warn("Create folder failed: Invalid folder name", { userId, folderName })
    return createErrorResponse("Tên thư mục không hợp lệ", { status: 400 })
  }

  try {
    await initializeStorageDirectories()

    const folderPath = parentPath && parentPath.trim()
      ? `${parentPath.trim()}/${sanitizedFolderName}`
      : sanitizedFolderName

    const validation = resolveAndValidateFolderPath(folderPath, userId)
    if (!validation.valid) {
      return createErrorResponse(validation.error, { status: validation.error === "Định dạng path không hợp lệ" ? 400 : 403 })
    }

    const folderFullPath = validation.resolvedPath!

    try {
      const stats = await fs.stat(folderFullPath)
      if (stats.isDirectory()) {
        logger.warn("Create folder failed: Folder already exists", {
          userId,
          folderPath,
          folderFullPath,
        })
        return createErrorResponse("Thư mục đã tồn tại", { status: 409, data: { folderPath } })
      }
    } catch (statError) {
      const errorCode = (statError as NodeJS.ErrnoException)?.code
      if (errorCode !== "ENOENT") {
        logger.warn("Error checking folder existence", {
          error: statError instanceof Error ? statError.message : String(statError),
          errorCode,
          folderFullPath,
        })
      }
    }

    logger.debug("Creating folder", { folderFullPath })
    await ensureDirectoryExists(folderFullPath)
    logger.debug("Folder created successfully", { folderFullPath })

    logger.success("Folder created successfully", {
      userId,
      folderName: sanitizedFolderName,
      folderPath,
      folderFullPath,
    })

    return createSuccessResponse({
      folderName: sanitizedFolderName,
      folderPath,
    }, { message: "Tạo thư mục thành công" })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    logger.error("Error creating folder", {
      userId,
      folderName,
      parentPath,
      error: error instanceof Error ? error : new Error(String(error)),
      errorMessage,
    })

    return createErrorResponse(
      "Đã xảy ra lỗi khi tạo thư mục",
      { 
        status: 500,
        data: process.env.NODE_ENV === "development" ? { details: errorMessage } : undefined
      }
    )
  }
}


