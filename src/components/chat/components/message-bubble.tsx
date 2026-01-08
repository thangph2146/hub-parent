"use client"

import { useEffect } from "react"
import type { Message } from "../types"
import { formatMessageTime } from "../utils/date-helpers"
import { highlightText } from "../utils/text-helpers"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TypographyPSmall, TypographyP, TypographySpanSmallMuted } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import { useElementSize } from "@/hooks/use-element-size"
import { logger } from "@/lib/config"

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
  
  // Hiển thị sender info cho group messages (không phải own message)
  const showSenderInfo = message.groupId && !isOwnMessage && message.sender
  const senderName = message.sender?.name || message.sender?.email || "Unknown"
  
  // Đo kích thước message bubble để log và điều chỉnh
  const { ref: bubbleRef, width: bubbleWidth, height: bubbleHeight } = useElementSize<HTMLDivElement>()
  
  // Log message bubble sizes để phân tích và điều chỉnh
  useEffect(() => {
    if ((bubbleWidth > 0 || bubbleHeight > 0) && message.id) {
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0
      const chatWindowWidth = viewportWidth * 0.64 // Ideal chat window width (64%)
      const maxBubbleWidth = chatWindowWidth * 0.75 // 75% of chat window (updated from 70%)
      const bubbleWidthRatio = viewportWidth > 0 ? ((bubbleWidth / viewportWidth) * 100).toFixed(2) : "0"
      const bubbleWidthVsMax = maxBubbleWidth > 0 ? ((bubbleWidth / maxBubbleWidth) * 100).toFixed(2) : "0"
      const bubbleWidthVsChatWindow = chatWindowWidth > 0 ? ((bubbleWidth / chatWindowWidth) * 100).toFixed(2) : "0"
      
      if (bubbleWidth > 0 && bubbleHeight > 0) {
        logger.debug("Message Bubble Element Sizes", {
          messageId: message.id.substring(0, 8),
          bubble: {
            width: parseFloat(bubbleWidth.toFixed(2)),
            height: parseFloat(bubbleHeight.toFixed(2)),
            widthRatio: `${bubbleWidthRatio}%`,
            maxWidth: `${maxBubbleWidth.toFixed(2)}px`,
            widthVsMax: `${bubbleWidthVsMax}%`,
            widthVsChatWindow: `${bubbleWidthVsChatWindow}%`,
            isOwnMessage,
            hasParent: !!parentMessage,
            hasSenderInfo: showSenderInfo
          },
          viewport: {
            width: viewportWidth,
            idealChatWindowWidth: chatWindowWidth.toFixed(2)
          },
          recommendations: parseFloat(bubbleWidthVsMax) < 50 
            ? ["Bubble width is less than 50% of max width - consider adjusting layout"]
            : parseFloat(bubbleWidthVsMax) > 95
            ? ["Bubble width is near max - consider increasing max-width"]
            : []
        })
      }
    }
  }, [bubbleWidth, bubbleHeight, message.id, isOwnMessage, parentMessage, showSenderInfo])

  return (
    <Flex
      direction="col"
      justify={isOwnMessage ? "end" : "start"}
      gap={2}
      fullWidth
      data-message-id={message.id}
      id={`message-${message.id}`}
    >
      <Flex 
        justify={isOwnMessage ? "end" : "start"} 
        align={isOwnMessage ? "end" : "start"}
        gap={2}
        fullWidth
      >
        {/* Avatar chỉ hiển thị cho messages của người khác, đặt bên trái */}
        {!isOwnMessage && showSenderInfo && message.sender && (
          <Flex shrink>
            <Avatar size="2xl">
              <AvatarImage src={message.sender.avatar || undefined} alt={senderName} />
              <AvatarFallback>
                {senderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Flex>
        )}
        <Flex
          ref={bubbleRef}
          direction="col"
          gap={1.5}
          fullWidth
          padding="md"
          position="relative"
          maxWidth="75"
          minWidth="140"
          rounded="lg"
          bg={isOwnMessage ? "primary" : "muted"}
          style={{
            flexShrink: 1,
            flexGrow: 0,
            width: "auto",
            ...(isOwnMessage ? { marginLeft: "auto" } : {}),
            ...(message.status === "sending" ? { opacity: 0.8 } : {}),
          }}
          data-role="bubble"
          onClick={() => {
            if (parentMessage?.id && onScrollToMessage) {
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
              gap={1}
              padding="sm-x"
              fullWidth={false}
              border="left"
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
              <TypographyPSmall>
                {searchQuery ? highlightText(parentMessage.content, searchQuery) : parentMessage.content}
              </TypographyPSmall>
            </Flex>
          )}
          <TypographyP>
            {searchQuery ? highlightText(message.content, searchQuery) : message.content}
          </TypographyP>
          <Flex align="center" justify="between" gap={1.5} fullWidth>
            <TypographyPSmall>
              {formatMessageTime(message.timestamp)}
            </TypographyPSmall>
            {isOwnMessage && message.status === "sending" && (
              <TypographySpanSmallMuted>
                Đang gửi...
              </TypographySpanSmallMuted>
            )}
            {isOwnMessage && !message.groupId && message.status !== "sending" && (
              <TypographyPSmall>
                {message.isRead ? "✓ Đã đọc" : "✓ Đã gửi"}
              </TypographyPSmall>
            )}
             
          </Flex>
        </Flex>
      </Flex>
      {/* Hiển thị avatar list của readers cho group messages - nằm ngoài message bubble */}
      {message.groupId && message.readers && message.readers.length > 0 && (
        <Flex align="center" justify={isOwnMessage ? "end" : "start"} gap={1}>
          {message.readers.slice(0, 5).map((reader) => (
            <Avatar key={reader.id} size="xs">
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
