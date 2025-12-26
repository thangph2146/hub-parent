/**
 * Image Item Component
 * Component hiển thị một image item với các actions
 */

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { TypographySpanSmall, IconSize } from "@/components/ui/typography"
import { copyToClipboard } from "../utils/clipboard-utils"
import { formatFileSize } from "../utils/format-utils"
import type { ImageItem as ImageItemType } from "../types"
import { Flex } from "@/components/ui/flex"

interface ImageItemProps {
  image: ImageItemType
  isSelected: boolean
  isDeleting: boolean
  onToggleSelect: (fileName: string) => void
  onDelete: (image: ImageItemType) => void
}

export const ImageItem = ({
  image,
  isSelected,
  isDeleting,
  onToggleSelect,
  onDelete,
}: ImageItemProps) => {
  const { toast } = useToast()

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyToClipboard(image.url, toast)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(image)
  }

  return (
    <Flex
      position="relative"
      className={cn(
        "aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 bg-muted group cursor-pointer",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 border-primary shadow-md"
          : "border-border hover:border-primary/50 hover:shadow-md"
      )}
    >
      <Image
        src={image.url}
        alt={image.originalName}
        fill
        className="object-cover transition-transform duration-200 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        unoptimized
      />
      <Flex position="absolute" className="top-2 left-2 z-20">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(image.fileName)}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5 bg-white/95 backdrop-blur-sm shadow-md border-2"
        />
      </Flex>
      <Flex 
        direction="col" 
        gap={0.5}
        position="absolute"
        className="bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      >
        <TypographySpanSmall className="text-white truncate font-medium">
          {image.originalName}
        </TypographySpanSmall>
        <TypographySpanSmall className="text-white/80 text-xs">
          {formatFileSize(image.size)}
        </TypographySpanSmall>
      </Flex>
      <Flex 
        align="center" 
        justify="center"
        gap={2} 
        position="absolute-inset"
        className="bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      >
        <Button size="sm" onClick={handleCopyUrl} title="Copy URL">
          Copy URL
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Xóa hình ảnh"
          className="bg-red-600/90 hover:bg-red-600"
        >
          {isDeleting ? (
            <IconSize size="sm" className="mr-1">
              <Loader2 className="animate-spin" />
            </IconSize>
          ) : (
            <IconSize size="sm" className="mr-1">
              <Trash2 />
            </IconSize>
          )}
          Xóa
        </Button>
      </Flex>
    </Flex>
  )
}

