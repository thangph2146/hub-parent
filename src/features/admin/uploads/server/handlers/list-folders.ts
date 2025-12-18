/**
 * List Folders Handler
 * Handler để lấy danh sách folders có sẵn
 */

import { NextRequest, NextResponse } from "next/server"
import type { ApiRouteContext } from "@/lib/api/types"
import { getUserId } from "@/lib/api/api-route-helpers"
import { initializeStorageDirectories } from "@/lib/utils/file-utils"
import { logger } from "@/lib/config"
import { scanStorageDirectoryForFolders } from "../utils/folder-scanning"

export const listFoldersHandler = async (_req: NextRequest, context: ApiRouteContext) => {
  const userId = getUserId(context)

  logger.info("List folders request received", { userId })

  try {
    await initializeStorageDirectories()

    const folders = await scanStorageDirectoryForFolders(10)
    folders.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" }))

    logger.success("Folders listed successfully", {
      userId,
      count: folders.length,
    })

    return NextResponse.json({
      success: true,
      data: folders,
    })
  } catch (error) {
    logger.error("Error listing folders", {
      userId,
      error: error instanceof Error ? error : new Error(String(error)),
    })

    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách thư mục" },
      { status: 500 }
    )
  }
}

