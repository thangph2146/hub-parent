"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "../types"
import { EmptyState } from "./empty-state"
import { MessageBubble } from "./message-bubble"

interface MessagesAreaProps {
  messages: Message[]
  currentUserId: string
  messagesMaxHeight?: number
  messagesMinHeight?: number
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onReply?: (message: Message) => void
  onMarkAsRead?: (messageId: string) => void
  onMarkAsUnread?: (messageId: string) => void
}

export function MessagesArea({
  messages,
  currentUserId,
  messagesMaxHeight,
  messagesMinHeight,
  scrollAreaRef,
  messagesEndRef,
  onReply,
  onMarkAsRead,
  onMarkAsUnread,
}: MessagesAreaProps) {
  // Create a map for quick parent message lookup
  const messageMap = new Map<string, Message>()
  messages.forEach((msg) => messageMap.set(msg.id, msg))

  const style = {
    maxHeight: messagesMaxHeight ? `${messagesMaxHeight}px` : "calc(100dvh - 13rem)",
    minHeight: messagesMinHeight ? `${messagesMinHeight}px` : "calc(100dvh - 13rem)",
  }

  return (
    <ScrollArea
      style={style}
    >
      <div className="flex flex-col p-4 gap-2" ref={scrollAreaRef}>
        {messages.length > 0 ? (
          <>
            {messages.map((message) => {
              const parentMessage = message.parentId ? messageMap.get(message.parentId) : null
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                  parentMessage={parentMessage}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <EmptyState variant="messages" />
        )}
      </div>
    </ScrollArea>
  )
}

