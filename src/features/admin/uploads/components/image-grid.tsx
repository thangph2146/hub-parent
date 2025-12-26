/**
 * Image Grid Component
 * Component hiển thị grid của images
 */

import { ImageItem } from "./image-item"
import type { ImageItem as ImageItemType } from "../types"
import { Grid } from "@/components/ui/grid"

interface ImageGridProps {
  images: ImageItemType[]
  selectedImages: Set<string>
  deletingIds: Set<string>
  onToggleSelect: (fileName: string) => void
  onDelete: (image: ImageItemType) => void
}

export const ImageGrid = ({
  images,
  selectedImages,
  deletingIds,
  onToggleSelect,
  onDelete,
}: ImageGridProps) => {
  return (
    <Grid 
      cols={5} 
      gap="responsive"
      fullWidth
      padding="sm"
    >
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
    </Grid>
  )
}

