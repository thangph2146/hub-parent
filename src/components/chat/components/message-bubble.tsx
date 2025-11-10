"use client"

import type { Message } from "../types"
import { formatMessageTime } from "../utils"

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  parentMessage?: Message | null
  currentUserId?: string
  onReply?: (message: Message) => void
}

export function MessageBubble({ message, isOwnMessage, parentMessage, currentUserId, onReply }: MessageBubbleProps) {
  const isParentOwnMessage = parentMessage?.senderId === currentUserId

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-[70%] rounded-lg px-4 py-2 cursor-pointer hover:opacity-90 transition-opacity ${
          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
        onClick={() => onReply?.(message)}
      >
        {parentMessage && (
          <div className={`mb-2 pb-2 border-l-2 pl-2 ${
            isOwnMessage ? "border-primary-foreground/30" : "border-muted-foreground/30"
          }`}>
            <p className={`text-xs font-medium ${
              isOwnMessage ? "text-primary-foreground/80" : "text-muted-foreground"
            }`}>
              {isParentOwnMessage ? "You" : "Reply"}
            </p>
            <p className={`text-xs truncate ${
              isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground/80"
            }`}>
              {parentMessage.content}
            </p>
          </div>
        )}
        <p className="text-sm break-words">{message.content}</p>
        <p className={`text-xs mt-1 ${
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        }`}>
          {formatMessageTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

