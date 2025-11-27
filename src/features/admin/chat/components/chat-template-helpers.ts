import type { Contact, Group, GroupRole } from "@/components/chat/types"
import { apiRoutes } from "@/lib/api/routes"
import { withApiBase } from "@/lib/config/api-paths"
import { requestJson } from "@/lib/api/client"

export function getCurrentUserRole(contact: Contact | null, currentUserId: string): GroupRole | undefined {
  if (!contact || contact.type !== "GROUP" || !contact.group) return undefined
  
  const member = contact.group.members.find(
    (m) => m.userId === currentUserId && !m.leftAt
  )
  
  return member?.role
}

export function createGroupContact(group: Group): Contact {
  return {
    id: group.id,
    name: group.name,
    image: group.avatar,
    lastMessage: "",
    lastMessageTime: group.createdAt,
    unreadCount: 0,
    isOnline: false,
    messages: [],
    type: "GROUP",
    group,
    isDeleted: false,
  }
}

export async function refreshGroupData(groupId: string): Promise<Group | null> {
  try {
    const response = await requestJson<Group>(withApiBase(apiRoutes.adminGroups.detail(groupId)))
    if (response.status === 404 || !response.ok) {
      // Throw error với message từ API để caller có thể hiển thị đúng message
      const errorMessage = response.error || "Nhóm không tồn tại hoặc bạn không phải thành viên"
      throw new Error(errorMessage)
    }
    return (response.data as Group) ?? null
  } catch (error) {
    const { logger } = await import("@/lib/config")
    logger.error("Error refreshing group data", error)
    // Re-throw error để caller có thể xử lý message
    throw error
  }
}

export function updateContactWithGroupData(
  contacts: Contact[],
  contactId: string,
  groupData: Group
): Contact[] {
  return contacts.map((contact) => {
    if (contact.id !== contactId || contact.type !== "GROUP") return contact
    
    return {
      ...contact,
      name: groupData.name,
      image: groupData.avatar || undefined,
      group: contact.group ? {
        ...contact.group,
        name: groupData.name,
        description: groupData.description || undefined,
        avatar: groupData.avatar || undefined,
        members: groupData.members,
        memberCount: groupData.memberCount,
      } : undefined,
    }
  })
}
