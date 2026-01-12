"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"
import type { Contact, Message } from "../../types"
import { ReplyBanner } from "./reply-banner"
import { GroupDeletedBanner } from "./group-deleted-banner"
import { forwardRef } from "react"

interface ChatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  messageInput: string
  setMessageInput: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleSendMessage: () => void
  currentChat: Contact | null
  replyingTo: Message | null
  onCancelReply: () => void
  deletedBannerRef?: React.RefObject<HTMLDivElement | null>
  isGroupDeleted?: boolean
}

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
function ChatInput(
  {
    inputRef,
    messageInput,
    setMessageInput,
    handleKeyDown,
    handleSendMessage,
    currentChat,
    replyingTo,
    onCancelReply,
    deletedBannerRef,
    isGroupDeleted = false,
  }: ChatInputProps,
  ref,
) {
  const isDisabled = !currentChat || isGroupDeleted

  return (
    <Flex 
      ref={ref} 
      direction="col" 
      fullWidth
      border="top"
      shrink
    >
      {replyingTo && !isGroupDeleted && (
          <ReplyBanner replyingTo={replyingTo} onCancel={onCancelReply} />
      )}
      {isGroupDeleted && <GroupDeletedBanner ref={deletedBannerRef} />}
      <Flex 
        align="end" 
        gap={1} 
        padding="sm"
        fullWidth
      >
        <Textarea
          ref={inputRef}
          style={{ maxHeight: "120px" , minHeight: "64px" }}
          placeholder={isGroupDeleted ? "Nhóm đã bị xóa" : "Type a message (Enter to send, Shift+Enter for new line)"}
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          rows={1}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || isDisabled}
        >
          <IconSize size="sm">
            <Send />
          </IconSize>
        </Button>
      </Flex>
    </Flex>
  )
})

ChatInput.displayName = "ChatInput"

