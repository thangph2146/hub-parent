/**
 * Delete Folder Handler
 * Handler để xóa folder
 */

import { NextRequest, NextResponse } from "next/server"
import type { ApiRouteContext } from "@/lib/api/types"
import { getUserId } from "@/lib/api/api-route-helpers"
import { deleteDirectory } from "@/lib/utils/file-utils"
import { promises as fs } from "fs"
import { logger } from "@/lib/config/logger"
import { resolveAndValidateFolderPath } from "../utils/path-validation"

export const deleteFolderHandler = async (req: NextRequest, context: ApiRouteContext) => {
  const userId = getUserId(context)
  const { searchParams } = new URL(req.url)
  const folderPath = searchParams.get("path")

  logger.info("Delete folder request received", {
    userId,
    folderPath,
  })

  if (!folderPath) {
    logger.warn("Delete failed: Missing path parameter", { userId })
    return NextResponse.json({ error: "Thiếu tham số path" }, { status: 400 })
  }

  try {
    const validation = resolveAndValidateFolderPath(folderPath, userId)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.error === "Định dạng path không hợp lệ" ? 400 : 403 })
    }

    const folderFullPath = validation.resolvedPath!

    logger.debug("Resolved folder path for deletion", {
      folderPath,
      folderFullPath,
    })

    try {
      const stats = await fs.stat(folderFullPath)
      if (!stats.isDirectory()) {
        logger.warn("Delete failed: Path is not a directory", { userId, folderFullPath })
        return NextResponse.json({ error: "Đường dẫn không phải là thư mục" }, { status: 400 })
      }
      logger.debug("Folder exists, proceeding with deletion", { folderFullPath })
    } catch {
      logger.warn("Delete failed: Folder not found", { userId, folderFullPath })
      return NextResponse.json({ error: "Thư mục không tồn tại" }, { status: 404 })
    }

    await deleteDirectory(folderFullPath)

    logger.success("Folder deleted successfully", {
      userId,
      folderPath,
      folderFullPath,
    })

    return NextResponse.json({
      success: true,
      message: "Xóa thư mục thành công",
    })
  } catch (error) {
    logger.error("Error deleting folder", {
      userId,
      folderPath,
      error: error instanceof Error ? error : new Error(String(error)),
    })

    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa thư mục" },
      { status: 500 }
    )
  }
}

