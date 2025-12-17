/**
 * Folder Utilities
 * Helper functions cho folder operations
 */

import type { FolderItem } from "../types"

export interface FolderTreeSelectNode {
  path: string
  name: string
  children: FolderTreeSelectNode[]
}

export const buildFolderTree = (folders: FolderItem[]): FolderTreeSelectNode[] => {
  const tree: FolderTreeSelectNode[] = []
  const pathMap = new Map<string, FolderTreeSelectNode>()

  // Sort folders by path depth (shallow first)
  const sortedFolders = [...folders].sort((a, b) => {
    const depthA = a.path.split("/").length
    const depthB = b.path.split("/").length
    if (depthA !== depthB) return depthA - depthB
    return a.path.localeCompare(b.path)
  })

  for (const folder of sortedFolders) {
    const parts = folder.path.split("/")
      const node: FolderTreeSelectNode = {
      path: folder.path,
      name: folder.name,
      children: [],
    }

    if (parts.length === 1) {
      // Root level folder
      tree.push(node)
    } else {
      // Find parent
      const parentPath = parts.slice(0, -1).join("/")
      const parent = pathMap.get(parentPath)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, add to root
        tree.push(node)
      }
    }

    pathMap.set(folder.path, node)
  }

  return tree
}

export const expandFolderTreeLevels = (
  nodes: FolderTreeSelectNode[],
  maxLevel: number = 2,
  level: number = 0
): Set<string> => {
  const openPaths = new Set<string>()
  
  const expand = (nodeList: FolderTreeSelectNode[], currentLevel: number) => {
    nodeList.forEach((node) => {
      if (currentLevel < maxLevel && node.children.length > 0) {
        openPaths.add(node.path)
        expand(node.children, currentLevel + 1)
      }
    })
  }
  
  expand(nodes, level)
  return openPaths
}

