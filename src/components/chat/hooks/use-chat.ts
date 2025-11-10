"use client"

import { useState, useEffect, useRef } from "react"
import type { Contact, Message } from "../types"
import { TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT, BASE_OFFSET_REM, REM_TO_PX } from "../constants"

interface UseChatProps {
  contacts: Contact[]
  currentUserId: string
}

export function useChat({ contacts, currentUserId }: UseChatProps) {
  const [contactsState, setContactsState] = useState<Contact[]>(contacts)
  const [currentChat, setCurrentChat] = useState<Contact | null>(contacts[0] || null)
  const [messageInput, setMessageInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [textareaHeight, setTextareaHeight] = useState<number>(TEXTAREA_MIN_HEIGHT)
  const [messagesMaxHeight, setMessagesMaxHeight] = useState<number | undefined>(undefined)

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

  // Clear input and reply when switching chats
  useEffect(() => {
    if (prevChatIdRef.current !== currentChat?.id) {
      setMessageInput("")
      setReplyingTo(null)
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
      parentId: replyingTo?.id || null,
    }

    setMessageInput("")
    setReplyingTo(null)
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

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return {
    contactsState,
    currentChat,
    setCurrentChat,
    messageInput,
    setMessageInput,
    replyingTo,
    textareaHeight,
    messagesMaxHeight,
    messagesEndRef,
    scrollAreaRef,
    inputRef,
    currentMessages,
    handleSendMessage,
    handleKeyDown,
    handleReplyToMessage,
    handleCancelReply,
  }
}

