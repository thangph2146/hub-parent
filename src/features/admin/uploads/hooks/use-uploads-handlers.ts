/**
 * Uploads Handlers Hook
 * Tách tất cả handlers logic ra khỏi component chính
 */

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { logger } from "@/lib/config"
import { useUploadsStore } from "../store/uploads-store"
import {
  useDeleteFolder,
  useDeleteImage,
  useBulkDeleteImages,
} from "./use-uploads-queries"
import { queryKeys } from "../config/query-keys"
import { addSetItem, removeSetItem } from "../utils/set-utils"
import type { UploadResponse, ImageItem } from "../types"

interface UseUploadsHandlersParams {
  closeBulkDelete: () => void
  closeSingleDelete: () => void
  closeFolderDelete: () => void
}

export const useUploadsHandlers = ({
  closeBulkDelete,
  closeSingleDelete,
  closeFolderDelete,
}: UseUploadsHandlersParams) => {
  const queryClient = useQueryClient()
  const { clearSelection } = useUploadsStore()
  const deleteFolderMutation = useDeleteFolder()
  const deleteImageMutation = useDeleteImage()
  const bulkDeleteImagesMutation = useBulkDeleteImages()
  const [deletingIds, setDeletingIds] = React.useState<Set<string>>(new Set())

  const handleUploadSuccess = React.useCallback(
    (data: UploadResponse["data"]) => {
      logger.success("Image uploaded successfully in client", {
        fileName: data.fileName,
        originalName: data.originalName,
        url: data.url,
        size: data.size,
      })

      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.images.all(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.folders.list(),
      })
    },
    [queryClient]
  )

  const handleDeleteImageConfirm = React.useCallback((image: ImageItem) => {
    const deleteId = image.fileName
    const relativePath = image.relativePath
    
    logger.info("handleDeleteImageConfirm called", {
      fileName: image.fileName,
      relativePath: relativePath,
    })
    
    // Đóng dialog ngay lập tức để tránh race condition
    closeSingleDelete()
    
    setDeletingIds((prev) => addSetItem(prev, deleteId))

    deleteImageMutation.mutate(relativePath, {
      onSuccess: () => {
        logger.success("Image deletion mutation succeeded", { relativePath })
      },
      onError: (error) => {
        logger.error("Image deletion mutation failed", { 
          relativePath, 
          error 
        })
      },
      onSettled: () => {
        setDeletingIds((prev) => removeSetItem(prev, deleteId))
      },
    })
  }, [deleteImageMutation, closeSingleDelete])

  const handleBulkDeleteConfirm = React.useCallback(
    (selectedImagesSet: Set<string>, allImages: ImageItem[]) => {
      if (selectedImagesSet.size === 0) {
        logger.warn("No images selected for bulk delete")
        return
      }

      const selectedImagesList = allImages.filter((img) =>
        selectedImagesSet.has(img.fileName)
      )
      
      if (selectedImagesList.length === 0) {
        logger.warn("No matching images found for bulk delete", {
          selectedImagesSize: selectedImagesSet.size,
          allImagesLength: allImages.length,
        })
        return
      }

      const relativePaths = selectedImagesList.map((img) => img.relativePath)
      
      logger.info("Bulk deleting images", {
        count: relativePaths.length,
        paths: relativePaths,
      })

      // Đóng dialog ngay lập tức để tránh race condition
      closeBulkDelete()

      bulkDeleteImagesMutation.mutate(relativePaths, {
        onSettled: () => {
          clearSelection()
        },
      })
    },
    [bulkDeleteImagesMutation, closeBulkDelete, clearSelection]
  )

  const handleDeleteFolderConfirm = React.useCallback((folderPath: string) => {
    logger.info("handleDeleteFolderConfirm called", { folderPath })
    
    // Đóng dialog ngay lập tức để tránh race condition
    closeFolderDelete()
    
    deleteFolderMutation.mutate(folderPath, {
      onSuccess: () => {
        logger.success("Folder deletion mutation succeeded", { folderPath })
      },
      onError: (error) => {
        logger.error("Folder deletion mutation failed", { folderPath, error })
      },
    })
  }, [deleteFolderMutation, closeFolderDelete])

  return {
    deletingIds,
    handleUploadSuccess,
    handleDeleteImageConfirm,
    handleBulkDeleteConfirm,
    handleDeleteFolderConfirm,
    deleteFolderMutation,
    deleteImageMutation,
    bulkDeleteImagesMutation,
  }
}

