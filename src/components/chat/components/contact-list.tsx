"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flex } from "@/components/ui/flex"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, ChevronDown } from "lucide-react"
import { TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import type { Contact } from "../types"
import { ContactItem } from "./contact-item"
import { groupContactsByTime } from "../utils/contact-helpers"

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
  
  // Nhóm contacts theo thời gian
  const groupedContacts = useMemo(() => {
    if (searchValue.trim()) {
      // Khi đang search, không nhóm theo thời gian
      return null
    }
    return groupContactsByTime(contacts)
  }, [contacts, searchValue])
  
  // State để quản lý các collapsible groups (mặc định mở nhóm đầu tiên)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const defaultOpen = new Set<string>()
    if (groupedContacts && groupedContacts.length > 0) {
      defaultOpen.add(groupedContacts[0].group)
    }
    return defaultOpen
  })
  
  const toggleGroup = (group: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
      return next
    })
  }
  
  return (
    <Flex 
      direction="col"
      fullWidth={!width || width === 0}
      margin="auto"
      maxWidth="100vw"
      id="contact-list"
      style={containerStyle}
    >
      <Flex 
        align="center" 
        position="relative"
        padding="sm"
        fullWidth
        border="bottom"
        shrink
      >
        <Flex position="absolute-left-center">
          <IconSize size="sm">
            <Search />
          </IconSize>
        </Flex>
        <Input
          placeholder="Tìm kiếm liên hệ..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          paddingLeft="9"
        />
      </Flex>
      <ScrollArea 
        fullWidth
        style={containerStyle}
      >
        <Flex 
          direction="col"
          fullWidth
          style={containerStyle}
        >
          {searchValue.trim() ? (
            // Khi đang search, hiển thị tất cả contacts không nhóm
            contacts.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                isSelected={selectedContactId === contact.id}
                onClick={() => onContactSelect(contact)}
              />
            ))
          ) : groupedContacts && groupedContacts.length > 0 ? (
            // Nhóm theo thời gian với Collapsible
            groupedContacts.map((group) => (
              <Collapsible
                key={group.group}
                open={openGroups.has(group.group)}
                onOpenChange={() => toggleGroup(group.group)}
                fullWidth
              >
                <CollapsibleTrigger asChild>
                  <Flex
                    align="center"
                    justify="between"
                    padding="sm"
                    fullWidth
                    hover="default"
                    cursor="pointer"
                  >
                    <TypographyPSmallMuted>
                      {group.label}
                    </TypographyPSmallMuted>
                    <IconSize size="xs">
                      <ChevronDown />
                    </IconSize>
                  </Flex>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Flex direction="col" fullWidth>
                    {group.contacts.map((contact) => (
                      <ContactItem
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContactId === contact.id}
                        onClick={() => onContactSelect(contact)}
                      />
                    ))}
                  </Flex>
                </CollapsibleContent>
              </Collapsible>
            ))
          ) : (
            // Không có contacts
            <Flex 
              direction="col" 
              align="center" 
              justify="center" 
              padding="responsive-lg"
              fullWidth
              textAlign="center"
            >
              <TypographyPSmallMuted>
                Không có liên hệ nào
              </TypographyPSmallMuted>
            </Flex>
          )}
        </Flex>
      </ScrollArea>
    </Flex>
  )
}
