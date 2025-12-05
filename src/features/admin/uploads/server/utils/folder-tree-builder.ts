/**
 * Folder Tree Builder Utilities
 * Shared utilities cho building folder tree structure
 */

import type { ScannedImage } from "./image-scanning"

export interface FolderTreeData {
  name: string
  path: string
  images: ScannedImage[]
  subfolders: Map<string, FolderTreeData>
}

/**
 * Build folder tree from flat image list
 */
export function buildFolderTreeFromImages(images: ScannedImage[]): {
  name: string
  path: string
  images: ScannedImage[]
  subfolders: Array<ReturnType<typeof folderToObject>>
} {
  const rootFolders = new Map<string, FolderTreeData>()

  for (const image of images) {
    const pathParts = image.relativePath.split("/")
    const rootFolderName = pathParts[0] || "images"
    const remainingPath = pathParts.slice(1, -1)
    const folderPath = remainingPath.join("/")

    if (!rootFolders.has(rootFolderName)) {
      rootFolders.set(rootFolderName, {
        name: rootFolderName,
        path: rootFolderName,
        images: [],
        subfolders: new Map(),
      })
    }
    const rootFolder = rootFolders.get(rootFolderName)!

    if (folderPath) {
      const folderParts = folderPath.split("/")
      let currentFolder = rootFolder

      for (const folderName of folderParts) {
        if (!currentFolder.subfolders.has(folderName)) {
          currentFolder.subfolders.set(folderName, {
            name: folderName,
            path: `${currentFolder.path}/${folderName}`,
            images: [],
            subfolders: new Map(),
          })
        }
        currentFolder = currentFolder.subfolders.get(folderName)!
      }

      currentFolder.images.push(image)
    } else {
      rootFolder.images.push(image)
    }
  }

  function folderToObject(folder: FolderTreeData): {
    name: string
    path: string
    images: ScannedImage[]
    subfolders: Array<ReturnType<typeof folderToObject>>
  } {
    return {
      name: folder.name,
      path: folder.path,
      images: folder.images,
      subfolders: Array.from(folder.subfolders.values())
        .map(folderToObject)
        .sort((a, b) => {
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
        }),
    }
  }

  return {
    name: "data",
    path: "data",
    images: [],
    subfolders: Array.from(rootFolders.values())
      .map(folderToObject)
      .sort((a, b) => {
        return a.name.localeCompare(b.name)
      }),
  }
}

