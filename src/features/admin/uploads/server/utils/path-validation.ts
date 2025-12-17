/**
 * Path Validation Utilities
 * Shared utilities cho path validation và security checks
 */

import path from "path"
import { STORAGE_DIR } from "@/lib/utils/file-utils"
import { logger } from "@/lib/config"

export const validateFolderPath = (folderPath: string): { valid: boolean; error?: string } => {
  if (folderPath.includes("..") || folderPath.includes("\\")) {
    return {
      valid: false,
      error: "Định dạng path không hợp lệ",
    }
  }
  return { valid: true }
}

export const resolveAndValidateFolderPath = (
  folderPath: string,
  userId?: string
): { valid: boolean; resolvedPath?: string; error?: string } => {
  const validation = validateFolderPath(folderPath)
  if (!validation.valid) {
    return validation
  }

  const folderFullPath = path.join(STORAGE_DIR, folderPath)
  const resolvedPath = path.resolve(folderFullPath)
  const resolvedStorageDir = path.resolve(STORAGE_DIR)

  if (!resolvedPath.startsWith(resolvedStorageDir)) {
    logger.warn("Path outside STORAGE_DIR", {
      userId,
      resolvedPath,
      resolvedStorageDir,
    })
    return {
      valid: false,
      error: "Đường dẫn không hợp lệ",
    }
  }

  return {
    valid: true,
    resolvedPath,
  }
}

export const resolveAndValidateFilePath = (
  relativePath: string,
  IMAGES_DIR: string,
  STORAGE_DIR: string,
  userId?: string
): { valid: boolean; filePath?: string; baseDir?: string; error?: string } => {
  let filePath: string
  let baseDir: string

  if (relativePath.startsWith("images/")) {
    const pathFromImagesDir = relativePath.replace(/^images\//, "")
    filePath = path.join(IMAGES_DIR, pathFromImagesDir)
    baseDir = IMAGES_DIR
  } else {
    filePath = path.join(STORAGE_DIR, relativePath)
    baseDir = STORAGE_DIR
  }

  const resolvedPath = path.resolve(filePath)
  const resolvedBaseDir = path.resolve(baseDir)

  if (!resolvedPath.startsWith(resolvedBaseDir)) {
    logger.warn("Path outside base directory", {
      userId,
      resolvedPath,
      resolvedBaseDir,
      baseDir,
    })
    return {
      valid: false,
      error: "Đường dẫn không hợp lệ",
    }
  }

  return {
    valid: true,
    filePath,
    baseDir,
  }
}

/**
 * Sanitize folder name
 */
export const sanitizeFolderName = (folderName: string): string =>
  folderName.trim().replace(/[^a-zA-Z0-9-_]/g, "_")

