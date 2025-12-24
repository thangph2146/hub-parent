"use client"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flex } from "@/components/ui/flex"
import { Search } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import type { Contact } from "../types"
import { ContactItem } from "./contact-item"

interface ContactListProps {
  contacts: Contact[]
  selectedContactId?: string
  onContactSelect: (contact: Contact) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  width?: number
}

export function ContactList({ contacts, selectedContactId, onContactSelect, searchValue = "", onSearchChange, width }: ContactListProps) {
  // Sử dụng width từ use-element-size nếu có, nếu không thì dùng fullWidth
  const containerStyle = width && width > 0 ? { width: `${width}px` } : undefined
  
  return (
    <Flex 
      direction="col"
      fullWidth={!width || width === 0}
      margin="auto"
      className="max-w-[100dvw]" 
      id="contact-list"
      style={containerStyle}
    >
      <Flex 
        align="center" 
        position="relative"
        padding="sm"
        fullWidth
        className="border-b shrink-0"
      >
        <IconSize size="sm" className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground z-10">
          <Search />
        </IconSize>
        <Input
          placeholder="Tìm kiếm liên hệ..."
          className="pl-9 h-9 w-full"
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </Flex>
      <ScrollArea 
        className="max-h-[calc(100dvh-12.5rem)]"
        style={containerStyle}
      >
        <Flex 
          direction="col"
          fullWidth
          className="divide-y"
          style={containerStyle}
        >
          {contacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isSelected={selectedContactId === contact.id}
              onClick={() => onContactSelect(contact)}
            />
          ))}
        </Flex>
      </ScrollArea>
    </Flex>
  )
}
