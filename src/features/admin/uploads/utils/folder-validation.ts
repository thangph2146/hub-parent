/**
 * Folder Validation Utilities
 * Helper functions cho validation và parsing folder paths
 */

export interface ParsedFolderPath {
  folderName: string
  parentPath: string | null
}

export const parseFolderPath = (fullPath: string): ParsedFolderPath | null => {
  const pathParts = fullPath.split("/").filter(Boolean)
  if (pathParts.length === 0) return null

  const folderName = pathParts[pathParts.length - 1]
  const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join("/") : null

  return { folderName, parentPath }
}

export const buildFullPath = (
  rootFolder: string | null,
  subPath: string
): string => {
  if (!rootFolder) return subPath.trim()
  if (!subPath.trim()) return rootFolder
  return `${rootFolder}/${subPath.trim()}`
}

