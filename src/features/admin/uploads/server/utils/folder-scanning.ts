/**
 * Folder Scanning Utilities
 * Shared utilities cho scanning folders từ file system
 */

import { promises as fs } from "fs"
import path from "path"
import { STORAGE_DIR } from "@/lib/utils/file-utils"
import { logger } from "@/lib/config"

export interface ScannedFolder {
  path: string
  name: string
  fullPath: string
}

/**
 * Scan directory for folders recursively
 */
export const scanDirectoryForFolders = async (
  dirPath: string,
  basePath: string = "",
  maxDepth: number = 4
): Promise<ScannedFolder[]> => {
  const folders: ScannedFolder[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderPath = basePath ? `${basePath}/${entry.name}` : entry.name
        const fullPath = path.join(dirPath, entry.name)
        const currentDepth = basePath ? basePath.split("/").length + 1 : 1

        folders.push({
          path: folderPath,
          name: entry.name,
          fullPath,
        })

        if (currentDepth < maxDepth) {
          const subFolders = await scanDirectoryForFolders(fullPath, folderPath, maxDepth)
          folders.push(...subFolders)
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn("Error scanning folders", {
        dirPath,
        basePath,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return folders
};

/**
 * Scan STORAGE_DIR for all folders
 */
export const scanStorageDirectoryForFolders = async (maxDepth: number = 10): Promise<ScannedFolder[]> => {
  const folders: ScannedFolder[] = []

  try {
    const storageEntries = await fs.readdir(STORAGE_DIR, { withFileTypes: true })

    for (const entry of storageEntries) {
      if (entry.isDirectory()) {
        const folderPath = entry.name
        const fullPath = path.join(STORAGE_DIR, entry.name)

        folders.push({
          path: folderPath,
          name: entry.name,
          fullPath,
        })

        const subFolders = await scanDirectoryForFolders(fullPath, folderPath, maxDepth)
        folders.push(...subFolders)
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

  return folders
};

