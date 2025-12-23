/**
 * Folder Tree Node Component
 * Component recursive để hiển thị folder tree với images
 */

import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Folder, ChevronRight } from "lucide-react"
import { iconSizes } from "@/lib/typography"
import { TypographySpanSmallMuted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"
import { ImageGrid } from "./image-grid"
import type { FolderNode, ImageItem } from "../types"

interface FolderTreeNodeProps {
  folder: FolderNode
  level?: number
  openFolders: Set<string>
  setOpenFolders: React.Dispatch<React.SetStateAction<Set<string>>>
  selectedImages: Set<string>
  deletingIds: Set<string>
  onToggleSelect: (fileName: string) => void
  onDelete: (image: ImageItem) => void
}

export const FolderTreeNode = React.memo(function FolderTreeNode({
  folder,
  level = 0,
  openFolders,
  setOpenFolders,
  selectedImages,
  deletingIds,
  onToggleSelect,
  onDelete,
}: FolderTreeNodeProps) {
  const hasContent = folder.images.length > 0 || folder.subfolders.length > 0
  const isOpen = openFolders.has(folder.path)

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        setOpenFolders((prev) => {
          const newSet = new Set(prev)
          newSet.add(folder.path)
          return newSet
        })
      } else {
        setOpenFolders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(folder.path)
          return newSet
        })
      }
    },
    [folder.path, setOpenFolders]
  )

  if (!hasContent) return null

  return (
    <Collapsible key={folder.path} open={isOpen} onOpenChange={handleOpenChange} className="mb-2">
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted rounded-md transition-colors text-left">
        <ChevronRight className={cn(iconSizes.sm, "transition-transform", isOpen && "rotate-90")} />
        <Folder className={cn(iconSizes.sm, "text-muted-foreground")} />
        <span className="font-medium">{folder.name}</span>
        <TypographySpanSmallMuted className="ml-auto">
          {folder.images.length} hình ảnh
          {folder.subfolders.length > 0 && `, ${folder.subfolders.length} thư mục`}
        </TypographySpanSmallMuted>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-6 mt-2">
        {/* Render images in this folder */}
        {folder.images.length > 0 && (
          <div className="mb-4 p-2">
            <ImageGrid
              images={folder.images}
              selectedImages={selectedImages}
              deletingIds={deletingIds}
              onToggleSelect={onToggleSelect}
              onDelete={onDelete}
            />
          </div>
        )}
        {/* Render subfolders */}
        {folder.subfolders.map((subfolder) => (
          <FolderTreeNode
            key={subfolder.path}
            folder={subfolder}
            level={level + 1}
            openFolders={openFolders}
            setOpenFolders={setOpenFolders}
            selectedImages={selectedImages}
            deletingIds={deletingIds}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
})

