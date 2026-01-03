/**
 * List Images Handler
 * Handler để lấy danh sách hình ảnh với pagination và folder tree
 */

import { NextRequest, NextResponse } from "next/server"
import type { ApiRouteContext } from "@/lib/api/types"
import { getUserId } from "@/lib/api/api-route-helpers"
import { STORAGE_DIR, initializeStorageDirectories } from "@/lib/utils/file-utils"
import { promises as fs } from "fs"
import path from "path"
import { logger } from "@/lib/config/logger"
import { scanDirectoryForImages } from "../utils/image-scanning"
import { buildFolderTreeFromImages } from "../utils/folder-tree-builder"

export const listImagesHandler = async (req: NextRequest, context: ApiRouteContext) => {
  const userId = getUserId(context)
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const offset = (page - 1) * limit

  logger.info("List images request received", {
    userId,
    page,
    limit,
    offset,
  })

  try {
    await initializeStorageDirectories()

    const images: Array<{
      fileName: string
      originalName: string
      size: number
      mimeType: string
      url: string
      relativePath: string
      createdAt: number
    }> = []

    logger.info("Starting directory scan", { storageDir: STORAGE_DIR })
    
    try {
      const storageEntries = await fs.readdir(STORAGE_DIR, { withFileTypes: true })
      
      for (const entry of storageEntries) {
        if (entry.isDirectory()) {
          const folderPath = path.join(STORAGE_DIR, entry.name)
          const rootFolder = entry.name
          
          if (entry.name === "images") {
            continue
          }
          
          if (entry.name === "uploads") {
            try {
              const uploadsEntries = await fs.readdir(folderPath, { withFileTypes: true })
              for (const uploadEntry of uploadsEntries) {
                if (uploadEntry.isDirectory()) {
                  const subFolderPath = path.join(folderPath, uploadEntry.name)
                  if (uploadEntry.name === "images") {
                    const subImages = await scanDirectoryForImages(subFolderPath, "images", "images")
                    images.push(...subImages)
                  } else {
                    const subImages = await scanDirectoryForImages(subFolderPath, uploadEntry.name, uploadEntry.name)
                    images.push(...subImages)
                  }
                }
              }
            } catch (error) {
              logger.warn("Error scanning uploads folder", {
                error: error instanceof Error ? error.message : String(error),
              })
            }
          } else {
            const subImages = await scanDirectoryForImages(folderPath, rootFolder, rootFolder)
            images.push(...subImages)
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        logger.warn("Error scanning STORAGE_DIR", {
          error: error instanceof Error ? error.message : String(error),
          storageDir: STORAGE_DIR,
        })
      }
    }
    
    logger.success("Directory scan completed", {
      totalImages: images.length,
    })

    images.sort((a, b) => b.createdAt - a.createdAt)

    const folderTree = buildFolderTreeFromImages(images)

    const total = images.length
    const paginatedImages = images.slice(offset, offset + limit)

    logger.success("Images listed successfully", {
      userId,
      total,
      page,
      limit,
      offset,
      returned: paginatedImages.length,
      totalPages: Math.ceil(total / limit),
    })

    return NextResponse.json({
      success: true,
      data: paginatedImages,
      folderTree,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error listing images", {
      userId,
      error: error instanceof Error ? error : new Error(String(error)),
    })

    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi lấy danh sách hình ảnh" },
      { status: 500 }
    )
  }
}

