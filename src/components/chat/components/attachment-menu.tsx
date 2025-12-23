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
        <IconSize size="sm" className="mr-2"><Image aria-label="Photos & Videos" /></IconSize> Photos & Videos
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm" className="mr-2"><Camera /></IconSize> Camera
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm" className="mr-2"><File /></IconSize> Document
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm" className="mr-2"><UserRound /></IconSize> Contact
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm" className="mr-2"><ChartBarIncreasing /></IconSize> Poll
      </DropdownMenuItem>
      <DropdownMenuItem>
        <IconSize size="sm" className="mr-2"><Brush /></IconSize> Drawing
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}