"use client"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search } from "lucide-react"
import type { Contact } from "../types"
import { ContactItem } from "./contact-item"

interface ContactListProps {
  contacts: Contact[]
  selectedContactId?: string
  onContactSelect: (contact: Contact) => void
}

export function ContactList({ contacts, selectedContactId, onContactSelect }: ContactListProps) {
  return (
    <>
      <div className="relative px-4 py-3 border-b shrink-0">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search or start new chat" className="pl-9 h-9" />
      </div>
      <ScrollArea className="max-h-[calc(100dvh-12.5rem)]">
        <div className="divide-y">
          {contacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isSelected={selectedContactId === contact.id}
              onClick={() => onContactSelect(contact)}
            />
          ))}
        </div>
      </ScrollArea>
    </>
  )
}

