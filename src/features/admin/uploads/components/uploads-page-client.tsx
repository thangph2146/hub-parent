"use client"

/**
 * Uploads Page Client Component
 * Component client để xử lý upload và hiển thị danh sách hình ảnh đã upload
 */

import { useEffect, useMemo } from "react"
import { ImageIcon, Upload, Loader2, Trash2 } from "lucide-react"
import { MultipleImageUpload } from "@/components/forms"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FieldSet, FieldLegend, FieldGroup } from "@/components/ui/field"
import { TypographySpanSmall, TypographySpanSmallMuted, IconSize, TypographyPSmall, TypographyPSmallMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { logger } from "@/lib/config/logger"
import { SelectionActionsWrapper } from "@/features/admin/resources/components"
import { useUploadsStore } from "../uploads-store"
import { useImagesList, useFoldersList } from "../hooks/use-uploads-queries"
import { useDialogs } from "../hooks/use-dialogs"
import { useFolderTreeInitialization } from "../hooks/use-folder-tree-initialization"
import { useUploadsHandlers } from "../hooks/use-uploads-handlers"
import { CreateFolderForm } from "./create-folder-form"
import { FolderSelector } from "./folder-selector"
import { FolderTreeNode } from "./folder-tree-node"
import { ImageGrid } from "./image-grid"
import { Pagination } from "./pagination"
import { ViewModeToggle } from "./view-mode-toggle"
import { DeleteDialogs } from "./delete-dialogs"

export const UploadsPageClient = () => {
  // Zustand Store - UI State
  const {
    viewMode,
    currentPage,
    selectedImages,
    selectedFolder,
    openFolders,
    setViewMode,
    setCurrentPage,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    setOpenFolders,
  } = useUploadsStore()

  // TanStack Query - Server State
  const { data: imagesData, isLoading } = useImagesList(currentPage, 50)
  const { data: availableFolders = [], isLoading: isLoadingFolders } = useFoldersList()

  // Dialogs state management - chỉ một instance duy nhất
  const {
    bulkDeleteConfirm,
    singleDeleteConfirm,
    folderDeleteConfirm,
    openSingleDelete,
    openFolderDelete,
    openBulkDelete,
    closeBulkDelete,
    closeSingleDelete,
    closeFolderDelete,
  } = useDialogs()

  // Handlers hook - truyền close functions từ cùng instance useDialogs
  const {
    deletingIds,
    handleUploadSuccess,
    handleDeleteImageConfirm,
    handleBulkDeleteConfirm,
    handleDeleteFolderConfirm,
    deleteFolderMutation,
    bulkDeleteImagesMutation,
  } = useUploadsHandlers({
    closeBulkDelete,
    closeSingleDelete,
    closeFolderDelete,
  })

  // Derived data
  const allImages = useMemo(() => imagesData?.data || [], [imagesData?.data])
  const folderTree = imagesData?.folderTree || null
  const pagination = imagesData?.pagination || null

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  // Preserve selected folder when folders list changes
  useEffect(() => {
    if (selectedFolder && availableFolders.length > 0) {
      const stillExists = availableFolders.some((f) => f.path === selectedFolder)
      if (!stillExists) {
        useUploadsStore.getState().setSelectedFolder(null)
      }
    }
  }, [availableFolders, selectedFolder])

  // Initialize folder tree open state
  useFolderTreeInitialization({
    folderTree,
    openFolders,
    setOpenFolders,
    maxLevel: 2,
  })

  const folderPath = {
    path: selectedFolder,
    isExistingFolder: !!selectedFolder,
  }

  const isAllSelected = allImages.length > 0 && selectedImages.size === allImages.length
  const isIndeterminate = selectedImages.size > 0 && selectedImages.size < allImages.length

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true || checked === "indeterminate") {
      selectAllImages(allImages)
    } else {
      clearSelection()
    }
  }

  // Keyboard shortcut: Ctrl+A / Cmd+A to select all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a" && allImages.length > 0) {
        e.preventDefault()
        if (isAllSelected) {
          clearSelection()
        } else {
          selectAllImages(allImages)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [allImages, isAllSelected, selectAllImages, clearSelection])

  return (
    <>
      <FieldSet className="group/field-set">
        <FieldLegend variant="legend">
          <Flex align="center" gap={2}>
            <IconSize size="md" className="shrink-0">
              <Upload />
            </IconSize>
            <span>Upload hình ảnh mới</span>
          </Flex>
        </FieldLegend>
        <TypographySpanSmall className="mx-0 mb-3 px-2 text-muted-foreground">
          Kéo thả hoặc chọn nhiều file hình ảnh để upload. Tự động resize và compress nếu cần.
          Hỗ trợ JPG, PNG, GIF, WEBP, SVG (tối đa 5MB mỗi file)
        </TypographySpanSmall>
        <FieldGroup>
          <CreateFolderForm
            availableFolders={availableFolders}
            isLoadingFolders={isLoadingFolders}
          />

          <FolderSelector
            availableFolders={availableFolders}
            isLoadingFolders={isLoadingFolders}
            onDeleteFolder={openFolderDelete}
          />

          <MultipleImageUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={(error: string) => {
              logger.error("Upload error from component", { error: new Error(error) })
            }}
            label=""
            maxSizeMB={5}
            maxDimension={500}
            folderPath={folderPath.path}
            isExistingFolder={folderPath.isExistingFolder}
          />
        </FieldGroup>
      </FieldSet>

      <FieldSet className="group/field-set">
        <FieldLegend variant="legend">
          <Flex align="center" gap={2}>
            <IconSize size="md" className="shrink-0">
              <ImageIcon />
            </IconSize>
            <span className="truncate">Tất cả hình ảnh</span>
          </Flex>
        </FieldLegend>
        <TypographySpanSmall className="mx-0 mb-3 px-2 text-muted-foreground">
          {pagination
            ? `Tổng cộng ${pagination.total} hình ảnh${viewMode === "tree" && folderTree ? " (theo thư mục)" : ""}`
            : "Danh sách tất cả hình ảnh đã upload"}
        </TypographySpanSmall>
        {!isLoading && allImages.length > 0 && (
          <Flex 
            direction="col"
            className="sm:flex-row mb-4" 
            gap={3}
            align="center"
            justify="between"
            fullWidth
          >
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Flex align="center" gap={2} className="group cursor-pointer w-full sm:w-auto justify-start sm:justify-end">
                  <Checkbox
                    checked={isIndeterminate ? "indeterminate" : isAllSelected}
                    onCheckedChange={handleSelectAll}
                    className="w-5 h-5 transition-all duration-200 group-hover:scale-110 shrink-0"
                    aria-label={
                      isAllSelected
                        ? "Bỏ chọn tất cả hình ảnh"
                        : isIndeterminate
                          ? `Đã chọn ${selectedImages.size}/${allImages.length} hình ảnh. Click để chọn tất cả`
                          : "Chọn tất cả hình ảnh"
                    }
                  />
                  <label
                    htmlFor="select-all-checkbox"
                    className="text-muted-foreground whitespace-nowrap cursor-pointer select-none transition-colors hover:text-foreground text-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSelectAll(isAllSelected ? false : true)
                    }}
                  >
                    {isIndeterminate ? (
                      <TypographyPSmall className="text-foreground">
                        Đã chọn {selectedImages.size}/{allImages.length}
                      </TypographyPSmall>
                    ) : (
                      "Chọn tất cả"
                    )}
                  </label>
                </Flex>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <Flex direction="col" gap={1}>
                  <TypographySpanSmall>
                    {isAllSelected
                      ? "Bỏ chọn tất cả hình ảnh"
                      : isIndeterminate
                        ? `Chọn tất cả ${allImages.length} hình ảnh`
                        : `Chọn tất cả ${allImages.length} hình ảnh`}
                  </TypographySpanSmall>
                  <TypographySpanSmall>
                    Nhấn <kbd className="px-1.5 py-0.5 rounded border">Ctrl+A</kbd> để chọn/bỏ chọn
                  </TypographySpanSmall>
                </Flex>
              </TooltipContent>
            </Tooltip>
          </Flex>
        )}
        <FieldGroup>
          {isLoading ? (
            <Flex align="center" className="py-12">
              <IconSize size="2xl">
                <Loader2 className="animate-spin text-primary" />
              </IconSize>
            </Flex>
          ) : allImages.length === 0 ? (
            <Flex direction="col" align="center" gap={4} className="py-16">
              <IconSize size="4xl" className="text-muted-foreground/50">
                <ImageIcon />
              </IconSize>
              <Flex direction="col" align="center" gap={2}>
                <TypographyPSmallMuted className="font-medium">
                  Chưa có hình ảnh nào được upload
                </TypographyPSmallMuted>
                <TypographySpanSmallMuted className="text-muted-foreground/70 text-center max-w-md">
                  Sử dụng form upload phía trên để bắt đầu upload hình ảnh
                </TypographySpanSmallMuted>
              </Flex>
            </Flex>
          ) : (
            <>
              {selectedImages.size > 0 && (
                <Flex direction="col" marginBottom={6} fullWidth>
                  <SelectionActionsWrapper
                    label={`Đã chọn ${selectedImages.size} hình ảnh`}
                    actions={
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={bulkDeleteImagesMutation.isPending || selectedImages.size === 0}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            logger.debug("Bulk delete button clicked", {
                              selectedImagesSize: selectedImages.size,
                              isPending: bulkDeleteImagesMutation.isPending,
                              openBulkDelete: typeof openBulkDelete,
                            })
                            if (selectedImages.size > 0) {
                              openBulkDelete(selectedImages.size)
                            }
                          }}
                          className="whitespace-nowrap shrink-0"
                        >
                          {bulkDeleteImagesMutation.isPending ? (
                            <IconSize size="sm" className="mr-2">
                              <Loader2 className="animate-spin" />
                            </IconSize>
                          ) : (
                            <IconSize size="sm" className="mr-2">
                              <Trash2 />
                            </IconSize>
                          )}
                          <span className="hidden sm:inline">
                            Xóa {selectedImages.size} hình đã chọn
                          </span>
                          <span className="sm:hidden">Xóa</span>
                        </Button>
                      </>
                    }
                  />
                </Flex>
              )}
              {viewMode === "tree" && folderTree ? (
                <Flex direction="col" gap={3}>
                  {folderTree.subfolders.map((subfolder) => (
                    <FolderTreeNode
                      key={subfolder.path}
                      folder={subfolder}
                      level={0}
                      openFolders={openFolders}
                      setOpenFolders={setOpenFolders}
                      selectedImages={selectedImages}
                      deletingIds={deletingIds}
                      onToggleSelect={toggleImageSelection}
                      onDelete={openSingleDelete}
                    />
                  ))}
                  {folderTree.images.length > 0 && (
                    <ImageGrid
                      images={folderTree.images}
                      selectedImages={selectedImages}
                      deletingIds={deletingIds}
                      onToggleSelect={toggleImageSelection}
                      onDelete={openSingleDelete}
                    />
                  )}
                </Flex>
              ) : (
                <ImageGrid
                  images={allImages}
                  selectedImages={selectedImages}
                  deletingIds={deletingIds}
                  onToggleSelect={toggleImageSelection}
                  onDelete={openSingleDelete}
                />
              )}
              {pagination && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </FieldGroup>
      </FieldSet>

      <DeleteDialogs
        bulkDeleteConfirm={bulkDeleteConfirm}
        singleDeleteConfirm={singleDeleteConfirm}
        folderDeleteConfirm={folderDeleteConfirm}
        isBulkDeleting={bulkDeleteImagesMutation.isPending}
        isSingleDeleting={(fileName) => deletingIds.has(fileName)}
        isFolderDeleting={(folderPath) =>
          deleteFolderMutation.isPending && deleteFolderMutation.variables === folderPath
        }
        onBulkDeleteConfirm={() => handleBulkDeleteConfirm(selectedImages, allImages)}
        onSingleDeleteConfirm={handleDeleteImageConfirm}
        onFolderDeleteConfirm={handleDeleteFolderConfirm}
        onCloseBulkDelete={closeBulkDelete}
        onCloseSingleDelete={closeSingleDelete}
        onCloseFolderDelete={closeFolderDelete}
      />
    </>
  )
}
