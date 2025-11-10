"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { useSocket } from "@/hooks/use-socket"
import { toast } from "@/hooks/use-toast"
import { useChatSocketBridge } from "./use-chat-socket-bridge"
import type { Contact, Message } from "../types"
import { TEXTAREA_MIN_HEIGHT, TEXTAREA_MAX_HEIGHT, BASE_OFFSET_REM, REM_TO_PX } from "../constants"

interface UseChatProps {
  contacts: Contact[]
  currentUserId: string
  role?: string | null
}

export function useChat({ contacts, currentUserId, role }: UseChatProps) {
  const [contactsState, setContactsState] = useState<Contact[]>(contacts)
  const [currentChatState, setCurrentChatState] = useState<Contact | null>(contacts[0] || null)
  
  // Wrapper để auto mark as read khi select contact
  const setCurrentChat = (contact: Contact | null) => {
    setCurrentChatState(contact)
    
    // Auto mark conversation as read khi user click vào contact (kể cả khi click lại contact hiện tại)
    if (contact && currentUserId) {
      const unreadMessages = contact.messages.filter(
        (msg) => msg.receiverId === currentUserId && !msg.isRead
      )

      if (unreadMessages.length > 0) {
        // Mark as read via API (fire and forget)
        const markAsRead = async () => {
          try {
            const response = await fetch(`/api/admin/conversations/${contact.id}/mark-read`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            })

            if (!response.ok) {
              console.error("Failed to mark conversation as read:", await response.text())
            }
          } catch (error) {
            console.error("Error auto-marking conversation as read:", error)
          }
        }

        // Debounce để tránh mark quá nhiều lần khi click nhanh
        setTimeout(markAsRead, 300)
      }
    }
  }
  
  // Keep currentChat reference for backward compatibility
  const currentChat = currentChatState
  const [messageInput, setMessageInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [textareaHeight, setTextareaHeight] = useState<number>(TEXTAREA_MIN_HEIGHT)
  const [messagesMaxHeight, setMessagesMaxHeight] = useState<number | undefined>(undefined)
  const [messagesMinHeight, setMessagesMinHeight] = useState<number | undefined>(undefined)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const replyBannerRef = useRef<HTMLDivElement>(null)
  const isSendingRef = useRef(false)
  const prevChatIdRef = useRef<string | undefined>(currentChat?.id)

  // Socket.IO integration
  const { joinConversation, leaveConversation } = useSocket({
    userId: currentUserId,
    role,
  })

  // Socket bridge để handle realtime messages (tương tự notifications)
  useChatSocketBridge({
    currentUserId,
    role,
    setContactsState,
  })

  const calculateBaseHeight = () => window.innerHeight - (BASE_OFFSET_REM * REM_TO_PX)
  const currentMessages = currentChat?.messages || []

  // Update currentChat when contactsState changes
  useEffect(() => {
    if (!currentChatState) return
    const updatedChat = contactsState.find((c) => c.id === currentChatState.id)
    if (updatedChat) {
      const messagesChanged = updatedChat.messages.length !== currentChatState.messages.length ||
        updatedChat.messages[updatedChat.messages.length - 1]?.id !== currentChatState.messages[currentChatState.messages.length - 1]?.id
      if (messagesChanged) {
        setCurrentChatState(updatedChat)
        // Trigger mark as read nếu có unread messages
        const unreadMessages = updatedChat.messages.filter(
          (msg) => msg.receiverId === currentUserId && !msg.isRead
        )
        if (unreadMessages.length > 0 && currentUserId) {
          setTimeout(async () => {
            try {
              await fetch(`/api/admin/conversations/${updatedChat.id}/mark-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              })
            } catch (error) {
              console.error("Error auto-marking conversation as read:", error)
            }
          }, 300)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsState, currentChatState?.id, currentUserId])

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

  // Sync messages area height with textarea and reply banner
  // Use useLayoutEffect để update trước khi browser paint, tránh flicker
  useLayoutEffect(() => {
    const updateHeights = () => {
      const baseHeight = calculateBaseHeight()
      const textareaExtraHeight = Math.max(0, textareaHeight - TEXTAREA_MIN_HEIGHT)
      
      // Estimate reply banner height trước (để tránh flicker)
      // Reply banner thường có height ~40-50px (py-2 + text + button)
      const ESTIMATED_REPLY_BANNER_HEIGHT = 48
      
      // Measure actual reply banner height nếu có
      let replyBannerHeight = 0
      if (replyingTo) {
        if (replyBannerRef.current) {
          // Đo height thực tế nếu element đã render
          replyBannerHeight = replyBannerRef.current.offsetHeight || ESTIMATED_REPLY_BANNER_HEIGHT
        } else {
          // Nếu chưa render, dùng estimate để tránh flicker
          replyBannerHeight = ESTIMATED_REPLY_BANNER_HEIGHT
        }
      }
      
      // Trừ 5px để tránh vượt quá yêu cầu
      const ADJUSTMENT_PX = 5
      const totalExtraHeight = textareaExtraHeight + replyBannerHeight + ADJUSTMENT_PX
      setMessagesMaxHeight(Math.max(0, baseHeight - totalExtraHeight))
      setMessagesMinHeight(Math.max(0, baseHeight - totalExtraHeight))
    }
    
    // Update ngay lập tức (useLayoutEffect chạy đồng bộ trước paint)
    updateHeights()
    
    // Sau đó đo lại chính xác nếu cần (cho trường hợp element chưa render)
    let rafId: number | null = null
    if (replyingTo && replyBannerRef.current) {
      rafId = requestAnimationFrame(() => {
        updateHeights()
      })
    }
    
    window.addEventListener("resize", updateHeights)
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener("resize", updateHeights)
    }
  }, [textareaHeight, replyingTo])

  // Join/leave conversation room when chat changes
  useEffect(() => {
    if (!currentChat || !currentUserId) return

    const chatId = currentChat.id
    joinConversation(currentUserId, chatId)

    return () => {
      leaveConversation(currentUserId, chatId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat?.id, currentUserId, joinConversation, leaveConversation])

  // Socket bridge sẽ handle realtime messages
  // Không cần listener riêng ở đây nữa

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

  const handleSendMessage = async () => {
    if (isSendingRef.current || !messageInput.trim() || !currentChat || !currentUserId) return
    isSendingRef.current = true

    const content = messageInput.trim()
    const parentId = replyingTo?.id || undefined

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: currentUserId,
      receiverId: currentChat.id,
      timestamp: new Date(),
      isRead: false,
      type: "PERSONAL",
      parentId: parentId || null,
    }

    setMessageInput("")
    setReplyingTo(null)
    setContactsState((prev) =>
      prev.map((contact) =>
        contact.id === currentChat.id
          ? {
              ...contact,
              messages: [...contact.messages, optimisticMessage],
              lastMessage: content,
              lastMessageTime: optimisticMessage.timestamp,
            }
          : contact
      )
    )

    try {
      // Persist to database via API (server will emit socket event)
      // Tương tự notifications: chỉ gửi qua API, server sẽ emit socket event
      const { apiRoutes } = await import("@/lib/api/routes")
      const response = await fetch(`/api${apiRoutes.adminMessages.send}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          receiverId: currentChat.id,
          parentId,
          type: "PERSONAL",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Không thể gửi tin nhắn" }))
        throw new Error(errorData.error || `Failed to send message: ${response.status}`)
      }

      const savedMessage = await response.json()

      // Replace optimistic message with saved one (from API response)
      // Socket event sẽ được handle bởi socket bridge, nhưng cần update ID ngay để tránh duplicate
      setContactsState((prev) =>
        prev.map((contact) =>
          contact.id === currentChat.id
            ? {
                ...contact,
                messages: contact.messages.map((msg) =>
                  msg.id === optimisticMessage.id
                    ? {
                        ...msg,
                        id: savedMessage.id,
                        timestamp: new Date(savedMessage.timestamp),
                      }
                    : msg
                ),
              }
            : contact
        )
      )
    } catch (error) {
      console.error("Error sending message:", error)
      
      // Show error toast to user
      const errorMessage = error instanceof Error ? error.message : "Không thể gửi tin nhắn"
      toast({
        title: "Lỗi gửi tin nhắn",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Remove optimistic message on error
      setContactsState((prev) =>
        prev.map((contact) =>
          contact.id === currentChat.id
            ? {
                ...contact,
                messages: contact.messages.filter((msg) => msg.id !== optimisticMessage.id),
              }
            : contact
        )
      )
    } finally {
      setTimeout(() => {
        isSendingRef.current = false
        if (inputRef.current) inputRef.current.value = ""
        setMessageInput("")
        inputRef.current?.focus()
      }, 50)
    }
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

  const addContact = (contact: Contact) => {
    setContactsState((prev) => {
      // Check if contact already exists
      if (prev.some((c) => c.id === contact.id)) {
        return prev
      }
      return [contact, ...prev]
    })
  }

  // Mark message as read/unread
  const markMessageAsRead = async (messageId: string) => {
    if (!currentChat) return

    try {
      const { apiRoutes } = await import("@/lib/api/routes")
      const response = await fetch(`/api${apiRoutes.adminMessages.markRead(messageId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Không thể đánh dấu đã đọc" }))
        throw new Error(errorData.error || "Failed to mark message as read")
      }

      // Socket event sẽ update state tự động
    } catch (error) {
      console.error("Error marking message as read:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể đánh dấu đã đọc",
        variant: "destructive",
      })
    }
  }

  const markMessageAsUnread = async (messageId: string) => {
    if (!currentChat) return

    try {
      const { apiRoutes } = await import("@/lib/api/routes")
      const response = await fetch(`/api${apiRoutes.adminMessages.markRead(messageId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: false }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Không thể đánh dấu chưa đọc" }))
        throw new Error(errorData.error || "Failed to mark message as unread")
      }

      // Socket event sẽ update state tự động
    } catch (error) {
      console.error("Error marking message as unread:", error)
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể đánh dấu chưa đọc",
        variant: "destructive",
      })
    }
  }

  // Auto mark conversation as read khi có tin nhắn mới đến (socket bridge sẽ update contactsState)
  // Logic mark as read đã được handle trong setCurrentChat wrapper

  return {
    contactsState,
    currentChat,
    setCurrentChat,
    messageInput,
    setMessageInput,
    replyingTo,
    textareaHeight,
    messagesMaxHeight,
    messagesMinHeight,
    messagesEndRef,
    scrollAreaRef,
    inputRef,
    replyBannerRef,
    currentMessages,
    handleSendMessage,
    handleKeyDown,
    handleReplyToMessage,
    handleCancelReply,
    addContact,
    markMessageAsRead,
    markMessageAsUnread,
  }
}

