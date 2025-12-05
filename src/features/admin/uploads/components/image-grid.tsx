/**
 * Image Grid Component
 * Component hiển thị grid của images
 */

import * as React from "react"
import { ImageItem } from "./image-item"
import type { ImageItem as ImageItemType } from "../types"

interface ImageGridProps {
  images: ImageItemType[]
  selectedImages: Set<string>
  deletingIds: Set<string>
  onToggleSelect: (fileName: string) => void
  onDelete: (image: ImageItemType) => void
}

export function ImageGrid({
  images,
  selectedImages,
  deletingIds,
  onToggleSelect,
  onDelete,
}: ImageGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
      {images.map((image) => (
        <ImageItem
          key={image.fileName}
          image={image}
          isSelected={selectedImages.has(image.fileName)}
          isDeleting={deletingIds.has(image.fileName)}
          onToggleSelect={onToggleSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

