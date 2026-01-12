import type { Contact } from "@/features/admin/chat/types"
import { applyReadStatus } from "./use-chat-message-helpers"

export const updateMessageReadStatus = (
  contacts: Contact[],
  contactId: string,
  messageId: string | undefined,
  isRead: boolean,
  readers: { id: string; name: string | null; email: string; avatar: string | null }[] | undefined,
  currentUserId: string | undefined
): Contact[] => {
  if (!messageId || !currentUserId) return contacts
  return applyReadStatus(contacts, {
    contactId,
    messageId,
    isRead,
    readers,
    currentUserId,
    mode: "socket",
  })
}

export const updateContactInState = (
  contacts: Contact[],
  contactId: string,
  updater: (contact: Contact) => Contact
): Contact[] => {
  return contacts.map((contact) => (contact.id === contactId ? updater(contact) : contact))
}

export const filterContactInState = (
  contacts: Contact[],
  predicate: (contact: Contact) => boolean
): Contact[] => {
  return contacts.filter(predicate)
}
