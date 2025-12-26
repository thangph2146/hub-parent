"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { TypographyP, TypographyPSmallMuted, IconSize } from "@/components/ui/typography"
import type { Contact } from "../types"
import { formatTime } from "../utils/date-helpers"

interface ContactItemProps {
  contact: Contact
  isSelected: boolean
  onClick: () => void
}

export function ContactItem({ contact, isSelected, onClick }: ContactItemProps) {
  return (
    <Flex fullWidth>
      <Flex
        as="button"
        onClick={onClick}
        fullWidth
        textAlign="left"
        position="relative"
        bg={isSelected ? "accent-10" : "none"}
        opacity={contact.isDeleted ? "60" : "none"}
        hover="default"
        aria-label={`Chat with ${contact.name}`}
      >
        <Flex align="center" gap={3} fullWidth padding="md">
          <Flex position="relative" shrink>
            <Avatar size="xl">
              <AvatarImage src={contact.image || undefined} alt={contact.name} />
              <AvatarFallback asChild>
                <TypographyP>{contact.name[0]}</TypographyP>
              </AvatarFallback>
            </Avatar>
            {contact.isOnline && (
              <Flex 
                position="absolute-bottom-right"
                height="2"
                width="2"
                rounded="full"
                bg="green-500-border"
              />
            )}
          </Flex>
          <Flex direction="col" fullWidth minWidth="0" gap={1}>
            <Flex align="center" justify="between" gap={2} fullWidth>
              <Flex align="center" gap={0} fullWidth minWidth="0">
                <CardTitle>
                  <TypographyP>{contact.name}</TypographyP>
                </CardTitle>
                {contact.isDeleted && (
                  <IconSize size="xs">
                    <Trash2 aria-label="Deleted" />
                  </IconSize>
                )}
              </Flex>
              <Flex shrink>
                <TypographyPSmallMuted>
                  {formatTime(contact.lastMessageTime)}
                </TypographyPSmallMuted>
              </Flex>
            </Flex>
            <Flex align="center" justify="between" gap={2} fullWidth>
              <Flex flex="1" minWidth="0" truncate>
                <CardDescription>
                  <TypographyPSmallMuted>
                    {contact.lastMessage}
                  </TypographyPSmallMuted>
                </CardDescription>
              </Flex>
              {contact.unreadCount > 0 && (
                <Flex shrink>
                  <Badge variant="default">
                    {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                  </Badge>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

