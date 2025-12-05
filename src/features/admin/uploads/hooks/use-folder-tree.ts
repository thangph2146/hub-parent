/**
 * Folder Tree Hook
 * Custom hook để quản lý folder tree logic
 */

import { useMemo } from "react"
import {
  buildFolderTree,
  expandFolderTreeLevels,
  type FolderTreeSelectNode,
} from "../utils/folder-utils"
import type { FolderItem } from "../types"

/**
 * Hook để build folder tree từ flat list
 */
export function useFolderTree(folders: FolderItem[]) {
  return useMemo(() => buildFolderTree(folders), [folders])
}

/**
 * Hook để auto-expand folder tree levels
 */
export function useAutoExpandFolderTree(
  nodes: FolderTreeSelectNode[],
  maxLevel: number = 2,
  enabled: boolean = true
) {
  return useMemo(() => {
    if (!enabled || nodes.length === 0) return new Set<string>()
    return expandFolderTreeLevels(nodes, maxLevel)
  }, [nodes, maxLevel, enabled])
}

