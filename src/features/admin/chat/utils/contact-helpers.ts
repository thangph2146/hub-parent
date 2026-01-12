import type { Contact, ChatFilterType } from "../types"

export type ContactTimeGroup = "today" | "yesterday" | "thisWeek" | "thisMonth" | "older"

export interface GroupedContacts {
  group: ContactTimeGroup
  label: string
  contacts: Contact[]
}

/**
 * Xác định nhóm thời gian của contact dựa trên lastMessageTime
 */
export function getContactTimeGroup(lastMessageTime: Date): ContactTimeGroup {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const lastMessageDate = new Date(lastMessageTime.getFullYear(), lastMessageTime.getMonth(), lastMessageTime.getDate())
  
  // Hôm nay
  if (lastMessageDate.getTime() === today.getTime()) {
    return "today"
  }
  
  // Hôm qua
  if (lastMessageDate.getTime() === yesterday.getTime()) {
    return "yesterday"
  }
  
  // Tuần này (7 ngày qua)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (lastMessageDate.getTime() >= weekAgo.getTime()) {
    return "thisWeek"
  }
  
  // Tháng này
  const monthAgo = new Date(today)
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  if (lastMessageDate.getTime() >= monthAgo.getTime()) {
    return "thisMonth"
  }
  
  // Cũ hơn
  return "older"
}

/**
 * Lấy label cho nhóm thời gian
 */
export function getTimeGroupLabel(group: ContactTimeGroup): string {
  const labels: Record<ContactTimeGroup, string> = {
    today: "Hôm nay",
    yesterday: "Hôm qua",
    thisWeek: "Tuần này",
    thisMonth: "Tháng này",
    older: "Cũ hơn"
  }
  return labels[group]
}

/**
 * Nhóm contacts theo thời gian
 */
export function groupContactsByTime(contacts: Contact[]): GroupedContacts[] {
  const groups: Record<ContactTimeGroup, Contact[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: []
  }
  
  contacts.forEach(contact => {
    const group = getContactTimeGroup(contact.lastMessageTime)
    groups[group].push(contact)
  })
  
  // Chỉ trả về các nhóm có contacts
  const groupOrder: ContactTimeGroup[] = ["today", "yesterday", "thisWeek", "thisMonth", "older"]
  return groupOrder
    .filter(group => groups[group].length > 0)
    .map(group => ({
      group,
      label: getTimeGroupLabel(group),
      contacts: groups[group]
    }))
}

/**
 * Lọc contacts theo filter type
 */
export function filterContacts(
  contacts: Contact[],
  filterType: ChatFilterType
): Contact[] {
  if (filterType === "ACTIVE") {
    return contacts.filter(contact => !contact.isDeleted)
  }
  if (filterType === "DELETED") {
    return contacts.filter(contact => contact.isDeleted)
  }
  return contacts
}
