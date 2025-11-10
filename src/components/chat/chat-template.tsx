"use client"

import { useState, useEffect, useRef } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Brush, Camera, ChartBarIncreasing, CircleOff, CircleUserRound, File, Image,
  ListFilter, MessageCircle, MessageSquareDashed, MessageSquareDot, Mic, Paperclip,
  Phone, Search, Send, Smile, SquarePen, Star, User, UserRound, Users, Video,
} from "lucide-react"

// Types
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

interface ChatTemplateProps {
  contacts: Contact[]
  currentUserId: string
}

// Constants
const TEXTAREA_MIN_HEIGHT = 36
const TEXTAREA_MAX_HEIGHT = 120
const BASE_OFFSET_REM = 13
const REM_TO_PX = 16

// Helper Functions
const formatTime = (date: Date): string => {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return "Vừa xong"
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" })
}

const formatMessageTime = (date: Date): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

// Sub-components
const AttachmentMenu = () => (
  <DropdownMenuContent side="top" align="start">
    <DropdownMenuItem><Image className="mr-2 h-4 w-4" /> Photos & Videos</DropdownMenuItem>
    <DropdownMenuItem><Camera className="mr-2 h-4 w-4" /> Camera</DropdownMenuItem>
    <DropdownMenuItem><File className="mr-2 h-4 w-4" /> Document</DropdownMenuItem>
    <DropdownMenuItem><UserRound className="mr-2 h-4 w-4" /> Contact</DropdownMenuItem>
    <DropdownMenuItem><ChartBarIncreasing className="mr-2 h-4 w-4" /> Poll</DropdownMenuItem>
    <DropdownMenuItem><Brush className="mr-2 h-4 w-4" /> Drawing</DropdownMenuItem>
  </DropdownMenuContent>
)

const MessageBubble = ({ message, isOwnMessage }: { message: Message; isOwnMessage: boolean }) => (
  <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
      isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
    }`}>
      <p className="text-sm break-words">{message.content}</p>
      <p className={`text-xs mt-1 ${
        isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
      }`}>
        {formatMessageTime(message.timestamp)}
      </p>
    </div>
  </div>
)

const ChatInput = ({ 
  inputRef, messageInput, setMessageInput, handleKeyDown, handleSendMessage, currentChat 
}: {
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  messageInput: string
  setMessageInput: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleSendMessage: () => void
  currentChat: Contact | null
}) => (
  <div className="flex items-end gap-1 min-h-[64px] max-h-[152px] px-4 py-2 border-t shrink-0">
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
)

// Main Component
export const ChatTemplate = ({ contacts, currentUserId }: ChatTemplateProps) => {
  const [contactsState, setContactsState] = useState<Contact[]>(contacts)
  const [currentChat, setCurrentChat] = useState<Contact | null>(contacts[0] || null)
  const [messageInput, setMessageInput] = useState("")
  const [textareaHeight, setTextareaHeight] = useState<number>(TEXTAREA_MIN_HEIGHT)
  const [messagesMaxHeight, setMessagesMaxHeight] = useState<number | undefined>(undefined)
  
  const isMobile = useIsMobile()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isSendingRef = useRef(false)
  const prevChatIdRef = useRef<string | undefined>(currentChat?.id)

  const calculateBaseHeight = () => window.innerHeight - (BASE_OFFSET_REM * REM_TO_PX)
  const currentMessages = currentChat?.messages || []

  // Update currentChat when contactsState changes
  useEffect(() => {
    if (!currentChat) return
    const updatedChat = contactsState.find((c) => c.id === currentChat.id)
    if (updatedChat) {
      const messagesChanged = updatedChat.messages.length !== currentChat.messages.length ||
        updatedChat.messages[updatedChat.messages.length - 1]?.id !== currentChat.messages[currentChat.messages.length - 1]?.id
      if (messagesChanged) setCurrentChat(updatedChat)
    }
  }, [contactsState, currentChat])

  // Clear input when switching chats
  useEffect(() => {
    if (prevChatIdRef.current !== currentChat?.id) {
      setMessageInput("")
      prevChatIdRef.current = currentChat?.id
    }
  }, [currentChat?.id])

  // Auto-resize textarea
  useEffect(() => {
    if (!inputRef.current) return
    inputRef.current.style.height = "auto"
    const newHeight = Math.min(Math.max(inputRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT)
    inputRef.current.style.height = `${newHeight}px`
    setTextareaHeight(newHeight)
  }, [messageInput])

  // Sync messages area height with textarea
  useEffect(() => {
    const updateHeights = () => {
      const baseHeight = calculateBaseHeight()
      const textareaExtraHeight = Math.max(0, textareaHeight - TEXTAREA_MIN_HEIGHT)
      setMessagesMaxHeight(Math.max(0, baseHeight - textareaExtraHeight))
    }
    updateHeights()
    window.addEventListener("resize", updateHeights)
    return () => window.removeEventListener("resize", updateHeights)
  }, [textareaHeight])

  // Auto scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      if (!messagesEndRef.current || !scrollAreaRef.current) return
      const viewport = scrollAreaRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      setTimeout(() => {
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
    }
    scrollToBottom()
  }, [currentChat?.id, currentMessages.length])

  const handleSendMessage = () => {
    if (isSendingRef.current || !messageInput.trim() || !currentChat) return
    isSendingRef.current = true

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: messageInput.trim(),
      senderId: currentUserId,
      receiverId: currentChat.id,
      timestamp: new Date(),
      isRead: false,
      type: "PERSONAL",
      parentId: null,
    }

    setMessageInput("")
    setContactsState((prev) =>
      prev.map((contact) =>
        contact.id === currentChat.id
          ? {
              ...contact,
              messages: [...contact.messages, newMessage],
              lastMessage: newMessage.content,
              lastMessageTime: newMessage.timestamp,
            }
          : contact
      )
    )

    setTimeout(() => {
      isSendingRef.current = false
      if (inputRef.current) inputRef.current.value = ""
      setMessageInput("")
      inputRef.current?.focus()
    }, 50)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b shrink-0">
              <h2 className="text-lg font-semibold">Chats</h2>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <SquarePen className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><User className="mr-2 h-4 w-4" /> New Contact</DropdownMenuItem>
                    <DropdownMenuItem><Users className="mr-2 h-4 w-4" /> New Group</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ListFilter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter Chats By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem><MessageSquareDot className="mr-2 h-4 w-4" /> Unread</DropdownMenuItem>
                      <DropdownMenuItem><Star className="mr-2 h-4 w-4" /> Favorites</DropdownMenuItem>
                      <DropdownMenuItem><CircleUserRound className="mr-2 h-4 w-4" /> Contacts</DropdownMenuItem>
                      <DropdownMenuItem><CircleOff className="mr-2 h-4 w-4" /> Non Contacts</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Groups</DropdownMenuItem>
                      <DropdownMenuItem><MessageSquareDashed className="mr-2 h-4 w-4" /> Drafts</DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative px-4 py-3 border-b shrink-0">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search or start new chat" className="pl-9 h-9" />
            </div>

            {/* Contact List */}
            <ScrollArea className="max-h-[calc(100dvh-12.5rem)] overflow-y-auto">
              <div className="divide-y">
                {contactsState.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setCurrentChat(contact)}
                    className={`w-full px-4 py-3 hover:bg-accent/50 transition-colors text-left relative ${
                      currentChat?.id === contact.id ? "bg-accent" : ""
                    }`}
                    aria-label={`Chat with ${contact.name}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={contact.image || undefined} alt={contact.name} />
                          <AvatarFallback className="text-sm">{contact.name[0]}</AvatarFallback>
                        </Avatar>
                        {contact.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm font-medium truncate">{contact.name}</CardTitle>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(contact.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <CardDescription className="text-xs truncate flex-1">{contact.lastMessage}</CardDescription>
                          {contact.unreadCount > 0 && (
                            <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                              {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
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
              {/* Chat Header */}
              <div className="flex items-center gap-3 h-16 px-4 border-b shrink-0">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={currentChat.image || undefined} alt={currentChat.name} />
                  <AvatarFallback className="text-xs">{currentChat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">{currentChat.name}</CardTitle>
                  <CardDescription className="text-xs truncate">Contact Info</CardDescription>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Search className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Chat Messages Area */}
              <ScrollArea
                className="overflow-y-auto min-h-0"
                style={messagesMaxHeight ? { maxHeight: `${messagesMaxHeight}px` } : { maxHeight: "calc(100dvh - 13rem)" }}
              >
                <div className="flex flex-col p-4 gap-2" ref={scrollAreaRef}>
                  {currentMessages.length > 0 ? (
                    <>
                      {currentMessages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwnMessage={message.senderId === currentUserId}
                        />
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex flex-col min-h-full items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Chưa có tin nhắn nào</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <ChatInput
                inputRef={inputRef}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleKeyDown={handleKeyDown}
                handleSendMessage={handleSendMessage}
                currentChat={currentChat}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full bg-background items-center justify-center p-4">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-base font-medium mb-1">Chọn một cuộc trò chuyện</p>
                <p className="text-sm">Bắt đầu trò chuyện từ danh sách bên trái</p>
              </div>
            </div>
          )}
        </ResizablePanel>

        {/* Mobile Chat Window */}
        {isMobile && currentChat && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
            <div className="flex items-center gap-3 h-16 px-4 border-b shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentChat(null)}>
                <Phone className="h-4 w-4 rotate-90" />
              </Button>
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={currentChat.image || undefined} alt={currentChat.name} />
                <AvatarFallback className="text-xs">{currentChat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold truncate">{currentChat.name}</CardTitle>
                <CardDescription className="text-xs truncate">Contact Info</CardDescription>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Search className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="flex flex-col p-4 gap-2">
                {currentMessages.length > 0 ? (
                  <>
                    {currentMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.senderId === currentUserId}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-col min-h-full items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Chưa có tin nhắn nào</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <ChatInput
              inputRef={inputRef}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              handleKeyDown={handleKeyDown}
              handleSendMessage={handleSendMessage}
              currentChat={currentChat}
            />
          </div>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
