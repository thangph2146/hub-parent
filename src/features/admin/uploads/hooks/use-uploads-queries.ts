/**
 * Uploads Query Hooks (TanStack Query)
 * Quản lý server state cho uploads feature
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/axios"
import { apiRoutes } from "@/lib/api/routes"
import { logger } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import { queryKeys } from "../config/query-keys"
import { useUploadsStore } from "../store/uploads-store"
import type { ImageItem, FolderNode, FolderItem } from "../types"

export interface ImagesListResponse {
  success: boolean
  data: ImageItem[]
  folderTree?: FolderNode
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FoldersListResponse {
  success: boolean
  data: FolderItem[]
}

export const useImagesList = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: queryKeys.uploads.images.list(page, limit),
    queryFn: async () => {
      logger.info("Fetching images list", { page, limit })
      const response = await apiClient.get<ImagesListResponse>(apiRoutes.uploads.list, {
        params: { page, limit },
      })
      
      if (!response.data.success) {
        throw new Error("Failed to fetch images")
      }
      
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Giữ data cũ khi refetch
  })
}

export const useFoldersList = () => {
  return useQuery({
    queryKey: queryKeys.uploads.folders.list(),
    queryFn: async () => {
      logger.info("Fetching folders list")
      const response = await apiClient.get<FoldersListResponse>(apiRoutes.uploads.list, {
        params: { listFolders: true },
      })
      
      if (!response.data.success) {
        throw new Error("Failed to fetch folders")
      }
      
      return response.data.data
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData, // Giữ data cũ khi refetch
  })
}

/**
 * Mutation: Create folder
 */
export const useCreateFolder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { folderName: string; parentPath?: string | null }) => {
      logger.info("Creating folder", data)
      const formData = new FormData()
      formData.append("action", "createFolder")
      formData.append("folderName", data.folderName)
      if (data.parentPath) {
        formData.append("parentPath", data.parentPath)
      }

      const response = await apiClient.post<{
        success: boolean
        data: { folderName: string; folderPath: string }
        message?: string
      }>(apiRoutes.uploads.createFolder, formData)

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create folder")
      }

      return response.data.data
    },
    onSuccess: (data) => {
      logger.success("Folder created successfully", { folderPath: data.folderPath })
      
      toast({
        title: "Thành công",
        description: `Đã tạo thư mục "${data.folderName}" thành công`,
      })

      // Invalidate folders list để refresh
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.folders.list(),
      })
      
      // Auto-select folder mới tạo
      useUploadsStore.getState().setSelectedFolder(data.folderPath)
    },
    onError: (error: Error) => {
      logger.error("Error creating folder", { error })
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo thư mục. Vui lòng thử lại.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Mutation: Delete folder
 */
export const useDeleteFolder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (folderPath: string) => {
      logger.info("Deleting folder", { folderPath })
      await apiClient.delete(apiRoutes.uploads.deleteFolder, {
        params: { path: folderPath, deleteFolder: true },
      })
      return folderPath
    },
    onSuccess: (folderPath) => {
      logger.success("Folder deleted successfully", { folderPath })
      
      toast({
        title: "Thành công",
        description: "Đã xóa thư mục thành công",
      })

      // Clear selection nếu folder bị xóa là folder đã chọn
      const { selectedFolder, setSelectedFolder } = useUploadsStore.getState()
      if (selectedFolder === folderPath) {
        setSelectedFolder(null)
      }

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.folders.list(),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.images.all(),
      })
    },
    onError: (error: Error) => {
      logger.error("Error deleting folder", { error })
      toast({
        title: "Lỗi",
        description: "Không thể xóa thư mục. Vui lòng thử lại.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Mutation: Delete image
 */
export const useDeleteImage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (relativePath: string) => {
      logger.info("Deleting image", { relativePath })
      await apiClient.delete(apiRoutes.uploads.delete, {
        params: { path: relativePath },
      })
      return relativePath
    },
    onSuccess: (relativePath) => {
      logger.success("Image deleted successfully", { relativePath })
      
      toast({
        title: "Thành công",
        description: "Đã xóa hình ảnh thành công",
      })

      // Remove from selection
      const { selectedImages, setSelectedImages } = useUploadsStore.getState()
      const fileName = relativePath.split("/").pop() || relativePath
      if (selectedImages.has(fileName)) {
        const newSet = new Set(selectedImages)
        newSet.delete(fileName)
        setSelectedImages(newSet)
      }

      // Invalidate images queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.images.all(),
      })
    },
    onError: (error: Error) => {
      logger.error("Error deleting image", { error })
      toast({
        title: "Lỗi",
        description: "Không thể xóa hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      })
    },
  })
}

/**
 * Mutation: Bulk delete images
 */
export const useBulkDeleteImages = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (relativePaths: string[]) => {
      logger.info("Bulk deleting images", { count: relativePaths.length })
      
      const deletePromises = relativePaths.map((path) =>
        apiClient.delete(apiRoutes.uploads.delete, {
          params: { path },
        }).catch((error) => {
          logger.error("Error deleting image in bulk", { path, error })
          return { error: true, path }
        })
      )

      const results = await Promise.all(deletePromises)
      const errors = results.filter((r) => r && "error" in r && r.error)
      
      return {
        successCount: relativePaths.length - errors.length,
        errorCount: errors.length,
      }
    },
    onSuccess: (result) => {
      if (result.errorCount > 0) {
        toast({
          title: "Cảnh báo",
          description: `Đã xóa ${result.successCount}/${result.successCount + result.errorCount} hình ảnh. ${result.errorCount} hình ảnh không thể xóa.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Thành công",
          description: `Đã xóa ${result.successCount} hình ảnh thành công`,
        })
      }

      // Clear selection
      useUploadsStore.getState().clearSelection()

      // Invalidate images queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.uploads.images.all(),
      })
    },
    onError: (error: Error) => {
      logger.error("Error in bulk delete", { error })
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi xóa hình ảnh. Vui lòng thử lại.",
        variant: "destructive",
      })
    },
  })
}

