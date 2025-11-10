import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Phone, Search, Video } from "lucide-react"
import type { Contact } from "../types"

interface ChatHeaderProps {
  contact: Contact
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatHeader({ contact, onBack, showBackButton = false }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 h-16 px-4 border-b shrink-0">
      {showBackButton && onBack && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <Phone className="h-4 w-4 rotate-90" />
        </Button>
      )}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={contact.image || undefined} alt={contact.name} />
        <AvatarFallback className="text-xs">{contact.name[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <CardTitle className="text-sm font-semibold truncate">{contact.name}</CardTitle>
        <CardDescription className="text-xs truncate">Contact Info</CardDescription>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

