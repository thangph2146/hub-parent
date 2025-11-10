"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "../types"
import { EmptyState } from "./empty-state"
import { MessageBubble } from "./message-bubble"

interface MessagesAreaProps {
  messages: Message[]
  currentUserId: string
  messagesMaxHeight?: number
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onReply?: (message: Message) => void
}

export function MessagesArea({
  messages,
  currentUserId,
  messagesMaxHeight,
  scrollAreaRef,
  messagesEndRef,
  onReply,
}: MessagesAreaProps) {
  // Create a map for quick parent message lookup
  const messageMap = new Map<string, Message>()
  messages.forEach((msg) => messageMap.set(msg.id, msg))

  return (
    <ScrollArea
      className="overflow-y-auto min-h-0"
      style={messagesMaxHeight ? { maxHeight: `${messagesMaxHeight}px` } : { maxHeight: "calc(100dvh - 13rem)" }}
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

