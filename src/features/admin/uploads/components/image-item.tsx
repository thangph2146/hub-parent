/**
 * Image Item Component
 * Component hiển thị một image item với các actions
 */

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2, Eye, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { TypographySpanSmall } from "@/components/ui/typography"
import { copyToClipboard } from "../utils/clipboard-utils"
import { formatFileSize } from "../utils/format-utils"
import type { ImageItem as ImageItemType } from "../types"
import { Flex } from "@/components/ui/flex"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyToClipboard(image.url, toast)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(image)
  }

  const handleViewImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDialogOpen(true)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    // Chỉ mở dialog nếu click trực tiếp vào hình ảnh, không phải vào các button hoặc checkbox
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="checkbox"]') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[data-slot="checkbox"]')
    ) {
      return
    }
    setIsDialogOpen(true)
  }

  return (
    <>
      <div
        onClick={handleImageClick}
        className={cn(
          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 bg-muted group cursor-pointer",
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
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 20vw, 400px"
          unoptimized
        />
      <Flex position="absolute" className="top-2 left-2 z-20 pointer-events-auto">
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
        position="absolute"
        className="right-0 bottom-0 w-full h-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none"
      >
        <Button 
          size="icon"
          onClick={handleViewImage} 
          title="Xem hình ảnh"
          className="pointer-events-auto bg-white/95 hover:bg-white text-foreground shadow-lg border-2 border-white/20"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button 
          size="icon"
          onClick={handleCopyUrl} 
          title="Copy URL"
          className="pointer-events-auto bg-white/95 hover:bg-white text-foreground shadow-lg border-2 border-white/20"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Xóa hình ảnh"
          className="bg-red-600/95 hover:bg-red-600 pointer-events-auto shadow-lg border-2 border-red-500/30"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </Flex>
    </div>

    {/* Dialog xem hình ảnh đầy đủ */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{image.originalName}</DialogTitle>
        </DialogHeader>
        <Flex
          position="relative"
          className="w-full h-[calc(95vh-120px)] min-h-[400px] bg-muted"
          align="center"
          justify="center"
        >
          <Image
            src={image.url}
            alt={image.originalName}
            fill
            className="object-contain"
            sizes="95vw"
            unoptimized
          />
        </Flex>
        <Flex
          direction="col"
          gap={2}
          className="p-6 pt-4 border-t"
        >
          <TypographySpanSmall className="text-muted-foreground">
            Kích thước: {formatFileSize(image.size)}
          </TypographySpanSmall>
        </Flex>
      </DialogContent>
    </Dialog>
    </>
  )
}

