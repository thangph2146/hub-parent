"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import type { ChatTemplateProps } from "./types"
import { useChat } from "./hooks/use-chat"
import { ChatListHeader } from "./components/chat-list-header"
import { ContactList } from "./components/contact-list"
import { ChatHeader } from "./components/chat-header"
import { MessagesArea } from "./components/messages-area"
import { ChatInput } from "./components/chat-input"
import { EmptyState } from "./components/empty-state"

export function ChatTemplate({ contacts, currentUserId }: ChatTemplateProps) {
  const isMobile = useIsMobile()
  const {
    contactsState,
    currentChat,
    setCurrentChat,
    messageInput,
    setMessageInput,
    replyingTo,
    messagesMaxHeight,
    messagesEndRef,
    scrollAreaRef,
    inputRef,
    currentMessages,
    handleSendMessage,
    handleKeyDown,
    handleReplyToMessage,
    handleCancelReply,
  } = useChat({ contacts, currentUserId })

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1 h-full">
        {/* Left Panel - Chat List */}
        <ResizablePanel
          defaultSize={isMobile ? 100 : 30}
          minSize={isMobile ? 100 : 25}
          maxSize={isMobile ? 100 : 50}
          className="flex flex-col min-w-0"
        >
          <div className="flex flex-col h-full border-r bg-background">
            <ChatListHeader />
            <ContactList
              contacts={contactsState}
              selectedContactId={currentChat?.id}
              onContactSelect={setCurrentChat}
            />
          </div>
        </ResizablePanel>

        {!isMobile && <ResizableHandle withHandle />}

        {/* Right Panel - Chat Window */}
        <ResizablePanel
          defaultSize={isMobile ? 0 : 70}
          minSize={isMobile ? 0 : 50}
          className={`flex flex-col min-w-0 ${isMobile ? "hidden" : ""}`}
        >
          {currentChat ? (
            <div className="flex flex-col h-full bg-background">
              <ChatHeader contact={currentChat} />
              <MessagesArea
                messages={currentMessages}
                currentUserId={currentUserId}
                messagesMaxHeight={messagesMaxHeight}
                scrollAreaRef={scrollAreaRef}
                messagesEndRef={messagesEndRef}
                onReply={handleReplyToMessage}
              />
              <ChatInput
                inputRef={inputRef}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleKeyDown={handleKeyDown}
                handleSendMessage={handleSendMessage}
                currentChat={currentChat}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
              />
            </div>
          ) : (
            <EmptyState variant="no-chat" />
          )}
        </ResizablePanel>

        {/* Mobile Chat Window */}
        {isMobile && currentChat && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
            <ChatHeader contact={currentChat} onBack={() => setCurrentChat(null)} showBackButton />
            <MessagesArea
              messages={currentMessages}
              currentUserId={currentUserId}
              scrollAreaRef={scrollAreaRef}
              messagesEndRef={messagesEndRef}
              onReply={handleReplyToMessage}
            />
            <ChatInput
              inputRef={inputRef}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              handleKeyDown={handleKeyDown}
              handleSendMessage={handleSendMessage}
              currentChat={currentChat}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
            />
          </div>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

// Re-export types for convenience
export type { Message, Contact, MessageType } from "./types"
export type { ChatTemplateProps } from "./types"
