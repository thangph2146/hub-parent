"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Mic, Paperclip, Send, Smile, X } from "lucide-react"
import type { Contact, Message } from "../types"
import { AttachmentMenu } from "./attachment-menu"

interface ChatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  messageInput: string
  setMessageInput: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleSendMessage: () => void
  currentChat: Contact | null
  replyingTo: Message | null
  onCancelReply: () => void
}

export function ChatInput({
  inputRef,
  messageInput,
  setMessageInput,
  handleKeyDown,
  handleSendMessage,
  currentChat,
  replyingTo,
  onCancelReply,
}: ChatInputProps) {
  return (
    <div className="flex flex-col border-t shrink-0">
      {replyingTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Replying to:</p>
            <p className="text-xs truncate">{replyingTo.content}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex items-end gap-1 min-h-[64px] max-h-[152px] px-4 py-2">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 mb-0.5">
          <Smile className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 mb-0.5">
              <Paperclip className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <AttachmentMenu />
        </DropdownMenu>
        <Textarea
          ref={inputRef}
          className="flex-1 min-h-[36px] resize-none overflow-y-auto"
          style={{ maxHeight: "120px" }}
          placeholder="Type a message (Enter to send, Shift+Enter for new line)"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!currentChat}
          rows={1}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 mb-0.5"
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !currentChat}
        >
          <Send className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 mb-0.5">
          <Mic className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

