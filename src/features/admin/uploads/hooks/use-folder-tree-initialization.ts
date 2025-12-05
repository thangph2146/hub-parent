/**
 * Folder Tree Initialization Hook
 * Custom hook để khởi tạo open folders cho tree view
 */

import { useEffect } from "react"
import type { FolderNode } from "../types"

interface UseFolderTreeInitializationProps {
  folderTree: FolderNode | null
  openFolders: Set<string>
  setOpenFolders: (folders: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  maxLevel?: number
}

/**
 * Hook để tự động mở các folder ở level đầu tiên khi tree được load
 */
export function useFolderTreeInitialization({
  folderTree,
  openFolders,
  setOpenFolders,
  maxLevel = 2,
}: UseFolderTreeInitializationProps) {
  useEffect(() => {
    if (folderTree && openFolders.size === 0) {
      const initialOpenFolders = new Set<string>()
      const initializeOpenFolders = (node: FolderNode, currentLevel: number = 0) => {
        if (currentLevel < maxLevel) {
          initialOpenFolders.add(node.path)
        }
        node.subfolders.forEach((subfolder) => {
          initializeOpenFolders(subfolder, currentLevel + 1)
        })
      }
      folderTree.subfolders.forEach((subfolder) => {
        initializeOpenFolders(subfolder, 0)
      })
      setOpenFolders(initialOpenFolders)
    }
  }, [folderTree, openFolders.size, setOpenFolders, maxLevel])
}

