/**
 * Create Folder Handler
 * Handler để tạo folder mới
 */

import { NextRequest, NextResponse } from "next/server"
import type { ApiRouteContext } from "@/lib/api/types"
import { getUserId } from "@/lib/api/api-route-helpers"
import { ensureDirectoryExists, initializeStorageDirectories } from "@/lib/utils/file-utils"
import { promises as fs } from "fs"
import { logger } from "@/lib/config/logger"
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
    return NextResponse.json({ error: "Thiếu tên thư mục" }, { status: 400 })
  }

  const sanitizedFolderName = sanitizeFolderName(folderName)

  if (!sanitizedFolderName) {
    logger.warn("Create folder failed: Invalid folder name", { userId, folderName })
    return NextResponse.json({ error: "Tên thư mục không hợp lệ" }, { status: 400 })
  }

  try {
    await initializeStorageDirectories()

    const folderPath = parentPath && parentPath.trim()
      ? `${parentPath.trim()}/${sanitizedFolderName}`
      : sanitizedFolderName

    const validation = resolveAndValidateFolderPath(folderPath, userId)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.error === "Định dạng path không hợp lệ" ? 400 : 403 })
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
        return NextResponse.json(
          { error: "Thư mục đã tồn tại", folderPath },
          { status: 409 }
        )
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

    return NextResponse.json({
      success: true,
      data: {
        folderName: sanitizedFolderName,
        folderPath,
      },
      message: "Tạo thư mục thành công",
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    logger.error("Error creating folder", {
      userId,
      folderName,
      parentPath,
      error: error instanceof Error ? error : new Error(String(error)),
      errorMessage,
    })

    return NextResponse.json(
      { 
        error: "Đã xảy ra lỗi khi tạo thư mục",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

