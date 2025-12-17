/**
 * Image Scanning Utilities
 * Shared utilities cho scanning images từ file system
 */

import { promises as fs } from "fs"
import path from "path"
import { isValidImageFile, IMAGES_DIR, STORAGE_DIR } from "@/lib/utils/file-utils"
import { logger } from "@/lib/config"

export interface ScannedImage {
  fileName: string
  originalName: string
  size: number
  mimeType: string
  url: string
  relativePath: string
  createdAt: number
}

export const extractOriginalName = (fileName: string): string => {
  const ext = path.extname(fileName)
  const nameWithoutExt = path.basename(fileName, ext)
  const parts = nameWithoutExt.split("_")
  
  if (parts.length >= 3) {
    return `${parts.slice(0, -2).join("_")}${ext}`
  }
  return fileName
}

/**
 * Get mime type from file extension
 */
export const getMimeTypeFromExtension = (ext: string): string => {
  const mimeTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  }
  return mimeTypeMap[ext.toLowerCase()] || "image/jpeg"
}

export const generateImageUrlPath = (
  fullPath: string,
  rootFolder: string,
  dirPath: string
): { urlPath: string; relativePathForResponse: string } => {
  if (rootFolder === "images" || dirPath.startsWith(IMAGES_DIR)) {
    const pathFromImagesDir = path.relative(IMAGES_DIR, fullPath)
    return {
      urlPath: `/api/uploads/images/${pathFromImagesDir.replace(/\\/g, "/")}`,
      relativePathForResponse: `images/${pathFromImagesDir.replace(/\\/g, "/")}`,
    }
  } else {
    const pathFromStorageDir = path.relative(STORAGE_DIR, fullPath)
    return {
      urlPath: `/api/uploads/${pathFromStorageDir.replace(/\\/g, "/")}`,
      relativePathForResponse: pathFromStorageDir.replace(/\\/g, "/"),
    }
  }
}

/**
 * Scan directory for images recursively
 */
export async function scanDirectoryForImages(
  dirPath: string,
  basePath: string = "",
  rootFolder: string = "",
  onImageFound?: (image: ScannedImage) => void
): Promise<ScannedImage[]> {
  const images: ScannedImage[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relativePath = path.join(basePath, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subImages = await scanDirectoryForImages(fullPath, relativePath, rootFolder, onImageFound)
        images.push(...subImages)
      } else if (entry.isFile() && isValidImageFile(entry.name)) {
        const stats = await fs.stat(fullPath)
        const ext = path.extname(entry.name)
        const { urlPath, relativePathForResponse } = generateImageUrlPath(fullPath, rootFolder, dirPath)

        const image: ScannedImage = {
          fileName: entry.name,
          originalName: extractOriginalName(entry.name),
          size: stats.size,
          mimeType: getMimeTypeFromExtension(ext),
          url: urlPath,
          relativePath: relativePathForResponse,
          createdAt: stats.mtimeMs,
        }

        images.push(image)
        onImageFound?.(image)
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn("Error scanning directory", {
        dirPath,
        basePath,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return images
}

