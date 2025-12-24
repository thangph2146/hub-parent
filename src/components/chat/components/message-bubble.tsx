"use client"

import type { Message } from "../types"
import { formatMessageTime } from "../utils"
import { highlightText } from "../utils/text-helpers"
import { isMessageReadByUser } from "../utils/message-helpers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TypographyPSmall, TypographyP, TypographySpanSmallMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  parentMessage?: Message | null
  currentUserId?: string
  onReply?: (message: Message) => void
  onMarkAsRead?: (messageId: string) => void
  onMarkAsUnread?: (messageId: string) => void
  searchQuery?: string
  onScrollToMessage?: (messageId: string) => void
}

export function MessageBubble({
  message,
  isOwnMessage,
  parentMessage,
  currentUserId,
  onReply,
  onMarkAsRead: _onMarkAsRead,
  onMarkAsUnread: _onMarkAsUnread,
  searchQuery = "",
  onScrollToMessage,
}: MessageBubbleProps) {
  const isParentOwnMessage = parentMessage?.senderId === currentUserId
  const canMarkRead = !isOwnMessage && (message.receiverId === currentUserId || (message.groupId && message.senderId !== currentUserId))
  
  // Hiển thị sender info cho group messages (không phải own message)
  const showSenderInfo = message.groupId && !isOwnMessage && message.sender
  const senderName = message.sender?.name || message.sender?.email || "Unknown"
  
  // Check if message is read by current user (for group messages: check readers array)
  const isReadByCurrentUser = isMessageReadByUser(message, currentUserId)

  return (
    <Flex 
      direction="col"
      justify={isOwnMessage ? "end" : "start"}
      gap={2}
      className="group"
      data-message-id={message.id}
      id={`message-${message.id}`}
    >
      <Flex justify={isOwnMessage ? "end" : "start"} gap={2}>
        {showSenderInfo && message.sender && (
          <Avatar size="2xl">
            <AvatarImage src={message.sender.avatar || undefined} alt={senderName} />
            <AvatarFallback>
              {senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={[
            "max-w-[70%] rounded-lg px-4 py-2 cursor-pointer hover:opacity-90 transition-opacity relative",
            isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            message.status === "sending" ? "opacity-80" : "",
          ].join(" ")}
          data-role="bubble"
          onClick={() => {
            if (parentMessage?.id && onScrollToMessage) {
              // If this message is a reply, clicking the bubble scrolls to the original message
              onScrollToMessage(parentMessage.id)
              return
            }
            onReply?.(message)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              if (parentMessage?.id && onScrollToMessage) {
                onScrollToMessage(parentMessage.id)
              } else {
                onReply?.(message)
              }
            }
          }}
        >
          {showSenderInfo && (
            <TypographyPSmall>
              {senderName}
            </TypographyPSmall>
          )}
          {parentMessage && (
            <Flex
              direction="col"
              gap={2}
              className={`pb-2 border-l-2 pl-2 ${
                isOwnMessage ? "border-primary-foreground/30" : "border-muted-foreground/40"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (parentMessage?.id) {
                  onScrollToMessage?.(parentMessage.id)
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (parentMessage?.id) {
                    onScrollToMessage?.(parentMessage.id)
                  }
                }
              }}
            >
              <TypographyPSmall>
                {isParentOwnMessage ? "You" : "Reply"}
              </TypographyPSmall>
              <TypographyPSmall className="truncate">
                {searchQuery ? highlightText(parentMessage.content, searchQuery) : parentMessage.content}
              </TypographyPSmall>
            </Flex>
          )}
          <TypographyP className="break-words">
            {searchQuery ? highlightText(message.content, searchQuery) : message.content}
          </TypographyP>
          <Flex align="center" justify="between" gap={2}>
            <TypographyPSmall>
              {formatMessageTime(message.timestamp)}
            </TypographyPSmall>
            {isOwnMessage && message.status === "sending" && (
              <TypographySpanSmallMuted>
                Đang gửi...
              </TypographySpanSmallMuted>
            )}
            {canMarkRead && (
              <button
                className={`opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded ${
                  isReadByCurrentUser
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-primary hover:text-primary/80"
                }`}
                title={isReadByCurrentUser ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
              >
                <TypographyPSmall>
                  {isReadByCurrentUser ? "✓ Đã đọc" : "○ Chưa đọc"}
                </TypographyPSmall>
              </button>
            )}
          </Flex>
        </div>
      </Flex>
      {/* Hiển thị avatar list của readers cho group messages - nằm ngoài message bubble */}
      {message.groupId && message.readers && message.readers.length > 0 && (
        <Flex align="center" justify={isOwnMessage ? "end" : "start"} gap={1}>
          {message.readers.slice(0, 5).map((reader) => (
            <Avatar key={reader.id} size="xs" className="border-2 border-background">
              <AvatarImage src={reader.avatar || undefined} alt={reader.name || reader.email} />
              <AvatarFallback>
                <TypographySpanSmallMuted>
                  {(reader.name || reader.email).charAt(0).toUpperCase()}
                </TypographySpanSmallMuted>
              </AvatarFallback>
            </Avatar>
          ))}
          {message.readers.length > 5 && (
            <TypographySpanSmallMuted>
              +{message.readers.length - 5}
            </TypographySpanSmallMuted>
          )}
        </Flex>
      )}
    </Flex>
  )
}
