"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { typography, iconSizes } from "@/lib/typography"
import type { Contact } from "../types"
import { formatTime } from "../utils"

interface ContactItemProps {
  contact: Contact
  isSelected: boolean
  onClick: () => void
}

export function ContactItem({ contact, isSelected, onClick }: ContactItemProps) {
  return (
    <div className="w-full">
      <button
        onClick={onClick}
        className={`w-full px-4 py-3 hover:bg-accent/10 transition-colors text-left relative ${
          isSelected ? "bg-accent/10" : ""
        } ${contact.isDeleted ? "opacity-60" : ""}`}
        aria-label={`Chat with ${contact.name}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.image || undefined} alt={contact.name} />
              <AvatarFallback className={typography.body.medium}>{contact.name[0]}</AvatarFallback>
            </Avatar>
            {contact.isOnline && (
              <span className={`absolute bottom-0 right-0 ${iconSizes.xs} rounded-full bg-green-500 border-2 border-background`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CardTitle className={`${typography.body.medium} font-medium truncate`}>{contact.name}</CardTitle>
                {contact.isDeleted && (
                  <Trash2 className={`${iconSizes.xs} text-destructive shrink-0`} aria-label="Deleted" />
                )}
              </div>
              <span className={`${typography.body.muted.small} shrink-0`}>
                {formatTime(contact.lastMessageTime)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <CardDescription className={`${typography.body.muted.small} truncate flex-1`}>{contact.lastMessage}</CardDescription>
              {contact.unreadCount > 0 && (
                <span className={`h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground ${typography.body.small} font-medium shrink-0`}>
                  {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

