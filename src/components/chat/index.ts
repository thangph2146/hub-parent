// Main component
export { ChatTemplate } from "./chat-template"

// Types
export type { Message, Contact, MessageType, ChatTemplateProps } from "./types"

// Components (for advanced usage)
export { AttachmentMenu } from "./components/attachment-menu"
export { MessageBubble } from "./components/message-bubble"
export { EmptyState } from "./components/empty-state"
export { ChatHeader } from "./components/chat-header"
export { ChatListHeader } from "./components/chat-list-header"
export { ContactItem } from "./components/contact-item"
export { ContactList } from "./components/contact-list"
export { MessagesArea } from "./components/messages-area"
export { ChatInput } from "./components/chat-input"
export { ChatWindow } from "./components/chat-window"

// Hooks
export { useChat } from "./hooks/use-chat"

// Utils
export { formatTime, formatMessageTime } from "./utils"

// Constants
export { TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT, BASE_OFFSET_REM, REM_TO_PX } from "./constants"

