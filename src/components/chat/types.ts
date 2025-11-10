export type MessageType = "NOTIFICATION" | "ANNOUNCEMENT" | "PERSONAL" | "SYSTEM"

export interface Message {
  id: string
  content: string
  subject?: string
  senderId: string | null
  receiverId: string
  timestamp: Date
  isRead: boolean
  type?: MessageType
  parentId?: string | null
}

export interface Contact {
  id: string
  name: string
  email?: string
  image?: string | null
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  isOnline: boolean
  messages: Message[]
}

export interface ChatTemplateProps {
  contacts: Contact[]
  currentUserId: string
  role?: string | null
  onNewConversation?: (contact: Contact) => void
}

