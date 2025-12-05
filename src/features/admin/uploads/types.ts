/**
 * Upload Types
 */

export interface UploadResponse {
  success: boolean
  data: {
    fileName: string
    originalName: string
    size: number
    mimeType: string
    url: string
    relativePath: string
  }
}

export interface UploadError {
  error: string
}

export interface ImageItem {
  fileName: string
  originalName: string
  size: number
  mimeType: string
  url: string
  relativePath: string
  createdAt: number
}

export interface FolderNode {
  name: string
  path: string
  images: ImageItem[]
  subfolders: FolderNode[]
}

export interface FolderItem {
  path: string
  name: string
}

