import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Brush, Camera, ChartBarIncreasing, File, Image, UserRound } from "lucide-react"
import { iconSizes } from "@/lib/typography"

export function AttachmentMenu() {
  return (
    <DropdownMenuContent side="top" align="start">
      <DropdownMenuItem>
        <Image className={`mr-2 ${iconSizes.sm}`} aria-label="Photos & Videos" /> Photos & Videos
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Camera className={`mr-2 ${iconSizes.sm}`} /> Camera
      </DropdownMenuItem>
      <DropdownMenuItem>
        <File className={`mr-2 ${iconSizes.sm}`} /> Document
      </DropdownMenuItem>
      <DropdownMenuItem>
        <UserRound className={`mr-2 ${iconSizes.sm}`} /> Contact
      </DropdownMenuItem>
      <DropdownMenuItem>
        <ChartBarIncreasing className={`mr-2 ${iconSizes.sm}`} /> Poll
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Brush className={`mr-2 ${iconSizes.sm}`} /> Drawing
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}