import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Brush, Camera, ChartBarIncreasing, File, Image, UserRound } from "lucide-react"
import { IconSize } from "@/components/ui/typography"

export function AttachmentMenu() {
  return (
    <DropdownMenuContent side="top" align="start">
      <DropdownMenuItem>
        <IconSize size="sm"><Image aria-label="Photos & Videos" /></IconSize> Photos & Videos
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm"><Camera /></IconSize> Camera
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm"><File /></IconSize> Document
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm"><UserRound /></IconSize> Contact
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm"><ChartBarIncreasing /></IconSize> Poll
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm"><Brush /></IconSize> Drawing
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}