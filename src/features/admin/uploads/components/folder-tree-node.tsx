/**
 * Folder Tree Node Component
 * Component recursive để hiển thị folder tree với images
 */

import * as React from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Folder, ChevronRight } from "lucide-react"
import { TypographySpanSmallMuted, IconSize, TypographyP } from "@/components/ui/typography"
import { cn } from "@/utils"
import { toggleSetItem } from "../utils/set-utils"
import { ImageGrid } from "./image-grid"
import type { FolderNode, ImageItem } from "../types"
import { Flex } from "@/components/ui/flex"

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

  const handleOpenChange = (_open: boolean) => {
    setOpenFolders((prev) => toggleSetItem(prev, folder.path))
  }

  if (!hasContent) return null

  return (
    <Collapsible key={folder.path} open={isOpen} onOpenChange={handleOpenChange} className="w-full mb-3">
      <CollapsibleTrigger asChild>
        <Flex 
          align="center" 
          gap={2} 
          className="w-full px-3 py-2.5 hover:bg-muted/80 rounded-lg transition-colors text-left cursor-pointer border border-transparent hover:border-border"
        >
          <IconSize size="sm" className={cn("transition-transform duration-200 text-muted-foreground", isOpen && "rotate-90")}>
            <ChevronRight />
          </IconSize>
          <IconSize size="sm" className="text-primary">
            <Folder />
          </IconSize>
          <TypographyP className="font-medium">{folder.name}</TypographyP>
          <TypographySpanSmallMuted className="ml-auto whitespace-nowrap">
            {folder.images.length} hình ảnh
            {folder.subfolders.length > 0 && `, ${folder.subfolders.length} thư mục`}
          </TypographySpanSmallMuted>
        </Flex>
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full mt-3">
        <Flex direction="col" gap={3}>
          {/* Render images in this folder */}
          {folder.images.length > 0 && (
              <ImageGrid
                images={folder.images}
                selectedImages={selectedImages}
                deletingIds={deletingIds}
                onToggleSelect={onToggleSelect}
                onDelete={onDelete}
              />
          )}
          {/* Render subfolders */}
          {folder.subfolders.length > 0 && (
            <Flex direction="col" className="ml-4">
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
            </Flex>
          )}
        </Flex>
      </CollapsibleContent>
    </Collapsible>
  )
})

