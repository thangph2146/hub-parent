/**
 * API Route: GET /api/uploads/[...path] - Serve uploaded images
 * Public route để serve hình ảnh đã upload
 */

import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { IMAGES_DIR, STORAGE_DIR } from "@/lib"
import { createErrorResponse } from "@/lib"
import { logger } from "@/utils"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    logger.debug("Serving image file", { pathSegments })
    
    if (pathSegments.length === 0) {
      return createErrorResponse("Invalid path format", { status: 400 })
    }
    
    let filePath: string
    let baseDir: string
    let resolvedBaseDir: string

    // Path format có thể là:
    // 1. ["images", "2025", "12", "04", "file.jpg"] - folder mặc định
    // 2. ["folder-name", "2025", "12", "04", "file.jpg"] - folder tự tạo
    if (pathSegments[0] === "images") {
      // Folder mặc định: lưu trong IMAGES_DIR
      const relativePath = pathSegments.slice(1)
      filePath = path.join(IMAGES_DIR, ...relativePath)
      baseDir = IMAGES_DIR
      resolvedBaseDir = path.resolve(IMAGES_DIR)
    } else {
      // Folder tự tạo: lưu trong STORAGE_DIR
      filePath = path.join(STORAGE_DIR, ...pathSegments)
      baseDir = STORAGE_DIR
      resolvedBaseDir = path.resolve(STORAGE_DIR)
    }

    logger.debug("Resolved file path for search", {
      pathSegments,
      filePath,
      baseDir,
      resolvedPath: path.resolve(filePath),
      cwd: process.cwd(),
    })

    // Security: Đảm bảo file path không vượt ra ngoài base directory
    const resolvedPath = path.resolve(filePath)
    
    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      logger.warn("Invalid path - outside base directory", {
        resolvedPath,
        resolvedBaseDir,
        filePath,
      })
      return createErrorResponse("Invalid path", { status: 403 })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
      logger.debug("File exists on disk", { filePath })
    } catch (error) {
      logger.warn("File NOT found on disk", { 
        filePath, 
        resolvedPath,
        error: error instanceof Error ? error.message : String(error)
      })
      return createErrorResponse("File not found", { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const fileSize = fileBuffer.length

    logger.success("Serving image file", {
      filePath,
      ext,
      size: fileSize,
      sizeKB: (fileSize / 1024).toFixed(2),
    })

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    }

    const contentType = contentTypeMap[ext] || "application/octet-stream"

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache 1 year
      },
    })
  } catch (error) {
    logger.error("Error serving file", {
      error: error instanceof Error ? error : new Error(String(error)),
    })
    return createErrorResponse("Internal server error", { status: 500 })
  }
}

