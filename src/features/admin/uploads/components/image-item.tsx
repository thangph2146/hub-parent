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
import { typography } from "@/lib/typography"
import type { ImageItem as ImageItemType } from "../types"

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

  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden border bg-muted group ${
        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <Image
        src={image.url}
        alt={image.originalName}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        unoptimized
      />
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(image.fileName)}
          onClick={(e) => e.stopPropagation()}
          className="bg-white/90 backdrop-blur-sm"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className={`text-white ${typography.body.small} font-medium truncate`}>{image.originalName}</p>
        <p className={`text-white/80 ${typography.body.small}`}>{(image.size / 1024).toFixed(1)} KB</p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => {
            navigator.clipboard.writeText(image.url)
            toast({
              title: "Đã copy",
              description: "URL đã được copy vào clipboard",
            })
          }}
          className={`bg-black/60 text-white ${typography.body.small} px-2 py-1 rounded hover:bg-black/80 transition-colors`}
          title="Copy URL"
        >
          Copy URL
        </button>
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 bg-red-600/80 hover:bg-red-600"
          onClick={() => onDelete(image)}
          disabled={isDeleting}
          title="Xóa hình ảnh"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )
}

