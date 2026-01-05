"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Send,
  Settings,
  User,
  Users,
  Info,
  ArrowLeft,
  Image as ImageIcon,
  Reply,
  X,
  Plus,
  Paperclip,
  Bell,
} from "lucide-react"
import { LiveKitRoomWrapper } from "@/components/video/livekit-room"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ChatMessageItem } from "@/components/chat/chat-message-item"
import { ChatInput } from "@/components/chat/chat-input"
import type { ChatThread, ChatMessage } from "@/types"
import {
  initSocket,
  getSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  sendMessage as sendSocketMessage,
  typing as emitTyping,
  markAsRead as emitMarkAsRead,
  onEvent,
  offEvent,
} from "@/lib/socket"
import { useAuth } from "@/contexts/auth-context"
import { useNotificationContext } from "@/components/notifications/notification-provider"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { setActiveConversationId } = useNotificationContext()
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showThreads, setShowThreads] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [socketConnected, setSocketConnected] = useState(false)
  const [showChatDetails, setShowChatDetails] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)

  const toggleChatDetails = () => setShowChatDetails(!showChatDetails)

  const viewProfile = () => {
    if (!activeThread) return

    if (activeThread.type === "group" && activeThread.groupId) {
      router.push(`/groups/${activeThread.groupId}`)
    } else {
      // Direct chat: find the other participant
      const otherUser = activeThread.participants.find((p) => p.id !== currentUser?.id)
      if (otherUser) {
        router.push(`/profile/${otherUser.id}`)
      }
    }
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentRoomRef = useRef<string | null>(null)
  const activeThreadIdRef = useRef<string | null>(null) // Ref để tránh stale closure

  // LiveKit state
  const [activeCallToken, setActiveCallToken] = useState<string | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [activeCallType, setActiveCallType] = useState<"video" | "audio">("video")
  const [creatingCall, setCreatingCall] = useState(false)
  const [activeCalls, setActiveCalls] = useState<Record<string, string>>({}) // threadId -> callId
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)

  // Handle incoming call from URL
  const incomingCallId = searchParams.get("callId")

  useEffect(() => {
    const checkIncomingCall = async () => {
      if (incomingCallId && !activeCallToken && !isCallActive) {
        try {
          const tokenData = await api.getVideoCallToken(incomingCallId)
          if (tokenData && tokenData.token) {
            setActiveCallToken(tokenData.token)
            setIsCallActive(true)
            setCurrentCallId(incomingCallId)
          }
        } catch (error) {
          console.error("Failed to join incoming call:", error)
        }
      }
    }
    checkIncomingCall()
  }, [incomingCallId])

  // Poll for active calls
  useEffect(() => {
    const checkActiveCalls = async () => {
      if (!currentUser) return
      try {
        const calls = await api.getVideoCalls({ status: "active", userId: currentUser.id })
        const activeCallMap: Record<string, string> = {}

        calls.forEach((call: any) => {
          if (call.groupId) {
            // Group call: Find thread with this groupId
            const thread = threads.find((t) => t.groupId == call.groupId)
            if (thread) {
              activeCallMap[thread.id] = call.id
            }
          } else if (call.callType === "1-1" && call.participants) {
            // Direct call: Find matching thread
            // call.participants contains Me and Other. Find Other's ID.
            const otherParticipant = call.participants.find((p: any) => {
              const pId = p.userId || p.user?.id || p.id
              return pId !== currentUser.id
            })
            const otherUserId = otherParticipant?.userId || otherParticipant?.user?.id || otherParticipant?.id

            if (otherUserId) {
              // Find direct thread with this user
              const thread = threads.find(
                (t) => t.type === "direct" && t.participants.some((p) => p.id === otherUserId)
              )
              if (thread) {
                activeCallMap[thread.id] = call.id
              }
            }
          }
        })
        setActiveCalls(activeCallMap)
      } catch (error) {
        console.error("Failed to check active calls:", error)
      }
    }

    checkActiveCalls() // Initial check
    const interval = setInterval(checkActiveCalls, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [currentUser, threads])

  // Helper to get conversation info (name, avatar, online status)
  const getThreadInfo = (thread: ChatThread) => {
    if (thread.type === "group") {
      return {
        name: thread.name || "Nhóm không tên",
        avatar: "/placeholder.svg", // Or group avatar if available
        isActive: false, // Group online status logic not typically shown same way
      }
    }

    // Direct chat: Find other participant
    // The participants array might already be filtered by the time we call this in render,
    // but good to be robust.
    // Wait, filteredThreads logic below modifies participants. Let's rely on original threads for this helper if possible,
    // Or just handle both.

    // Actually, let's keep it simple. If direct, find the one that isn't me.
    const otherParticipant = thread.participants.find((p) => p.id !== currentUser?.id) || thread.participants[0]
    return {
      name: otherParticipant?.displayName || otherParticipant?.name || "Người dùng",
      avatar: otherParticipant?.avatar || "/placeholder.svg",
      isActive: otherParticipant?.isOnline || false,
    }
  }

  const joinExistingCall = async (callId: string) => {
    try {
      setCreatingCall(true)
      const tokenData = await api.getVideoCallToken(callId)
      if (tokenData && tokenData.token) {
        setActiveCallToken(tokenData.token)
        setIsCallActive(true)
        setCurrentCallId(callId)
      }
    } catch (error) {
      console.error("Failed to join call:", error)
      alert("Không thể tham gia cuộc gọi. Vui lòng thử lại.")
    } finally {
      setCreatingCall(false)
    }
  }

  const startCall = async (type: "audio" | "video") => {
    if (!activeThread) return

    // Check if there is an active call in this thread
    if (activeCalls[activeThread.id]) {
      joinExistingCall(activeCalls[activeThread.id])
      return
    }

    try {
      setCreatingCall(true)
      setActiveCallType(type)

      let call
      if (activeThread.type === "direct") {
        const receiverId = activeThread.participants.find((p) => p.id !== currentUser?.id)?.id
        if (!receiverId) {
          alert("Không xác định được người nhận cuộc gọi.")
          return
        }
        call = await api.createVideoCall({ receiverId, type })
      } else {
        // Group Call
        if (!activeThread.groupId) {
          alert("Không tìm thấy ID nhóm để bắt đầu cuộc gọi.")
          return
        }
        // Extract all participant IDs for group call
        const participantIds = activeThread.participants.map((p) => p.id)
        call = await api.createVideoCall({
          groupId: activeThread.groupId,
          participantIds,
          type,
        })
      }

      if (!call) throw new Error("Failed to create call")

      const tokenData = await api.getVideoCallToken(call.id)

      if (tokenData && tokenData.token) {
        setActiveCallToken(tokenData.token)
        setIsCallActive(true)
        setCurrentCallId(call.id)
      } else {
        throw new Error("No token received")
      }
    } catch (error) {
      console.error("Failed to create call:", error)
      alert("Không thể tạo cuộc gọi. Vui lòng thử lại.")
    } finally {
      setCreatingCall(false)
    }
  }

  const handleDisconnect = async () => {
    setIsCallActive(false)
    setActiveCallToken(null)

    if (currentCallId) {
      try {
        await api.leaveVideoCall(currentCallId)
      } catch (err) {
        console.error("Failed to leave call:", err)
      }
      setCurrentCallId(null)
    }
    // Remove callId from URL if present
    const currentUrl = new URL(window.location.href)
    if (currentUrl.searchParams.has("callId")) {
      currentUrl.searchParams.delete("callId")
      // Use window.history to update without reload or router.replace
      window.history.replaceState({}, "", currentUrl.toString())
    }
  }

  useEffect(() => {
    const socket = initSocket()
    if (socket) {
      socket.on("connect", () => {
        setSocketConnected(true)
        const joinAllRooms = async () => {
          try {
            const allThreads = await api.getChatThreads()
            for (const thread of allThreads) {
              joinRoom(thread.id)
            }
          } catch (error) {
            console.error("Failed to join conversation rooms:", error)
          }
        }
        joinAllRooms()
      })
      socket.on("disconnect", () => {
        setSocketConnected(false)
      })
      socket.on("connect_error", () => {
        setSocketConnected(false)
      })

      const cleanupNewMessage = onEvent("new_message", (message: any) => {
        // If we are viewing this thread, mark as read immediately
        if (activeThreadIdRef.current === message.conversationId) {
          emitMarkAsRead(message.conversationId, message.id)
        }

        const unreadCounts = message.unreadCounts || {}
        const currentUserUnreadCount = currentUser?.id ? unreadCounts[currentUser.id] || 0 : 0

        setThreads((prevThreads) => {
          const currentActiveThreadId = activeThreadIdRef.current
          return prevThreads.map((thread) => {
            if (thread.id !== message.conversationId) {
              return thread
            }

            const isViewing = currentActiveThreadId === message.conversationId
            const isFromCurrentUser = message.senderId === currentUser?.id
            const updatedUnreadCount = isViewing || isFromCurrentUser ? 0 : currentUserUnreadCount

            return {
              ...thread,
              lastMessage: {
                id: message.id,
                content: message.content,
                timestamp: new Date(message.createdAt || message.timestamp),
                senderId: message.senderId || message.sender?.id || "",
              },
              unreadCount: updatedUnreadCount,
            }
          })
        })

        if (message.conversationId === activeThreadIdRef.current) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) {
              return prev
            }
            const transformedMessage: ChatMessage = {
              id: message.id,
              threadId: message.conversationId,
              conversationId: message.conversationId,
              senderId: message.senderId,
              sender: message.sender
                ? {
                    id: message.sender.id,
                    displayName: message.sender.displayName || message.sender.username,
                    avatar: message.sender.avatar,
                  }
                : ({} as any),
              content: message.content,
              timestamp: new Date(message.createdAt || message.timestamp),
              createdAt: new Date(message.createdAt || message.timestamp),
              type: message.type || "text",
              isRead: true,
              replyToId: message.replyToId || (message.replyTo ? message.replyTo.id : undefined),
              replyTo: message.replyTo
                ? {
                    id: message.replyTo.id,
                    content: message.replyTo.content,
                    senderId: message.replyTo.senderId,
                    createdAt: message.replyTo.createdAt,
                    type: message.replyTo.type,
                    messageType: message.replyTo.type, // Map potential backend diff
                    conversationId: message.replyTo.conversationId,
                    sender: message.replyTo.sender
                      ? {
                          id: message.replyTo.sender.id,
                          displayName: message.replyTo.sender.displayName || message.replyTo.sender.username,
                          avatar: message.replyTo.sender.avatar,
                        }
                      : undefined,
                  }
                : undefined,
            }
            return [...prev, transformedMessage]
          })
        }
      })

      return () => {
        cleanupNewMessage()
        disconnectSocket()
      }
    }
  }, [currentUser?.id])

  // Load chat threads on mount and when conversationId changes
  useEffect(() => {
    loadChatThreads()
  }, [currentUser, searchParams])

  useEffect(() => {
    activeThreadIdRef.current = activeThread?.id || null

    // Cập nhật active conversation ID để filter notifications
    setActiveConversationId(activeThread?.id || null)

    if (!activeThread) return

    const socket = getSocket()
    if (!socket || !socketConnected) {
      loadMessages(activeThread.id)
      return
    }

    currentRoomRef.current = activeThread.id
    joinRoom(activeThread.id)
    loadMessages(activeThread.id)

    const cleanupMessageUpdated = onEvent("message_edited", (data: any) => {
      if (data.conversationId === activeThread.id) {
        setMessages((prev) => prev.map((m) => (m.id === data.messageId ? { ...m, content: data.content } : m)))
      }
    })

    const cleanupMessageDeleted = onEvent("message_deleted", (data: any) => {
      if (data.conversationId === activeThread.id) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
      }
    })

    const cleanupTyping = onEvent("user_typing", (data: any) => {
      if (data.conversationId === activeThread.id && data.userId !== currentUser?.id) {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set([...prev, data.userId]))
          setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev)
              newSet.delete(data.userId)
              return newSet
            })
          }, 3000)
        } else {
          setTypingUsers((prev) => {
            const newSet = new Set(prev)
            newSet.delete(data.userId)
            return newSet
          })
        }
      }
    })

    const cleanupConversationRead = onEvent("conversation_read", (data: any) => {
      if (data.conversationId) {
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === data.conversationId ? { ...thread, unreadCount: data.unreadCount || 0 } : thread
          )
        )
      }
    })

    const cleanupError = onEvent("error", (error: any) => {
      setError(error.message || "Đã xảy ra lỗi")
    })

    return () => {
      setActiveConversationId(null)
      cleanupMessageUpdated()
      cleanupMessageDeleted()
      cleanupTyping()
      cleanupConversationRead()
      cleanupError()
    }
  }, [activeThread, socketConnected, currentUser])

  // Auto scroll to bottom when messages change (debounce để tránh scroll liên tục)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 10)

    // Mark as read if viewing active thread with unread messages
    if (activeThread && messages.length > 0 && socketConnected && activeThread.unreadCount > 0) {
      const lastMsg = messages[messages.length - 1]
      emitMarkAsRead(activeThread.id, lastMsg.id)

      // Optimistic update
      setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, unreadCount: 0 } : t)))
      setActiveThread((prev) => (prev ? { ...prev, unreadCount: 0 } : null))
    }

    return () => clearTimeout(timeoutId)
  }, [messages, typingUsers.size, activeThread?.id, socketConnected])

  const loadChatThreads = async () => {
    try {
      setLoading(true)
      const data = await api.getChatThreads()
      setThreads(data)

      // Kiểm tra conversationId từ query params
      const conversationIdFromUrl = searchParams.get("conversationId")
      const groupIdFromUrl = searchParams.get("groupId")

      if (conversationIdFromUrl) {
        // Tìm conversation trong danh sách
        const targetThread = data.find((thread) => thread.id === conversationIdFromUrl)
        if (targetThread) {
          setActiveThread(targetThread)
          setShowThreads(false)
        } else if (data.length > 0) {
          // Nếu không tìm thấy, chọn conversation đầu tiên
          setActiveThread(data[0])
        }
      } else if (groupIdFromUrl) {
        // Find group chat by groupId
        let targetThread = data.find((thread) => thread.groupId && String(thread.groupId) === String(groupIdFromUrl))

        if (!targetThread) {
          try {
            const fetchedThread = await api.getConversationByGroupId(groupIdFromUrl)
            if (fetchedThread) {
              targetThread = fetchedThread
              data.unshift(fetchedThread)
              setThreads([...data])
            }
          } catch (e) {
            console.error("Could not fetch group conversation", e)
          }
        }

        if (targetThread) {
          // If the thread was just added/created, we need to ensure local state is updated
          // However, for immediate feedback, we can just set it as active
          setActiveThread(targetThread)
          setShowThreads(false)
        }
      } else if (data.length > 0 && !activeThread) {
        // Nếu không có conversationId trong URL, chọn conversation đầu tiên
        setActiveThread(data[0])
      }

      if (socketConnected && getSocket()) {
        for (const thread of data) {
          if (thread.id) joinRoom(thread.id)
        }
      }
    } catch (err) {
      setError("Không thể tải danh sách trò chuyện")
    } finally {
      setLoading(false)
    }
  }

  // Optimize message grouping with useMemo
  const groupedMessages = useMemo(() => {
    return messages.reduce(
      (groups, message) => {
        const date = new Date(message.createdAt).toDateString()
        if (!groups[date]) groups[date] = []
        groups[date].push(message)
        return groups
      },
      {} as Record<string, ChatMessage[]>
    )
  }, [messages])

  const loadMessages = async (threadId: string, isBackground = false) => {
    try {
      if (!isBackground) {
        setMessages([])
      }
      const data = await api.getChatMessages(threadId)
      if (data && data.length > 0) {
        setMessages(data)
      }
    } catch (err) {
      console.error("Failed to load messages:", err)
    }
  }

  // Refactored sendMessage to accept content directly (from ChatInput)
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !activeThread) return

    const socket = getSocket()
    const messageContent = content.trim()

    // Try to send via Socket.IO first
    if (socket && socketConnected) {
      try {
        sendSocketMessage({
          conversationId: activeThread.id,
          content: messageContent,
          type: "text",
          replyToId: replyTo?.id,
        })
        setReplyTo(null)
        // Stop typing indicator
        emitTyping(activeThread.id, false)
        setIsTyping(false)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }

        // Force reload messages to ensure replyTo data is present
        loadMessages(activeThread.id, true) // isBackground = true
        return
      } catch (err) {
        console.error("Failed to send via socket, falling back to REST:", err)
      }
    }

    // Fallback to REST API if socket not available
    try {
      const message: Omit<ChatMessage, "id"> = {
        threadId: activeThread.id,
        senderId: currentUser?.id || "current-user",
        sender: currentUser || ({ id: "current-user", displayName: "Bạn" } as any),
        conversationId: activeThread.id,
        content: messageContent,
        timestamp: new Date(),
        createdAt: new Date(),
        type: "text",
        isRead: true,
        replyToId: replyTo?.id,
        replyTo: replyTo || undefined,
      }

      await api.sendMessage(message)
      setReplyTo(null)
      loadMessages(activeThread.id, true) // isBackground = true
      loadChatThreads()
    } catch (err) {
      console.error("Failed to send message:", err)
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.")
    }
  }

  // Wrapper for typing handler
  const handleTyping = (isTypingStatus: boolean) => {
    if (activeThread && socketConnected) {
      emitTyping(activeThread.id, isTypingStatus)
    }
  }

  const handleFileSelect = (file: File) => {
    if (file && activeThread) {
      // Mock file upload - in real app would upload to server
      const message: Omit<ChatMessage, "id"> = {
        threadId: activeThread.id,
        senderId: currentUser?.id || "current-user",
        sender: currentUser || ({ id: "current-user", displayName: "Bạn" } as any),
        conversationId: activeThread.id,
        content: `Đã gửi file: ${file.name}`,
        timestamp: new Date(),
        createdAt: new Date(),
        type: "file",
        isRead: true,
      }

      api.sendMessage(message).then(() => {
        loadMessages(activeThread.id, true)
        loadChatThreads()
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Only kept for other inputs if any? ChatInput handles its own keys.
    // Can leave empty or remove usage.
  }

  // Deprecated handleInputChange
  // const handleInputChange = ... (Removed)

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Filter và sort threads: tìm kiếm theo tên participant hoặc lastMessage content
  // Lọc currentUser ra khỏi participants trong direct chat

  const filteredThreads = threads
    .filter((thread) => {
      const info = getThreadInfo(thread)
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      // Search by thread name (user name or group name) OR message content
      return (
        info.name.toLowerCase().includes(query) || (thread.lastMessage?.content || "").toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0
      const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0
      return timeB - timeA
    })

  const selectThread = (thread: ChatThread) => {
    setActiveThread(thread)
    setShowThreads(false)

    // Đánh dấu conversation đã đọc khi user chọn thread
    if (socketConnected && thread.id) {
      emitMarkAsRead(thread.id, thread.lastMessage?.id || "")

      // Update local state để UI update ngay (optimistic update)
      setThreads((prevThreads) => prevThreads.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t)))
    }
  }

  const backToThreads = () => {
    setShowThreads(true)
    setActiveThread(null)
  }

  if (loading) {
    return (
      <AppShell noPadding>
        <div className="flex h-full">
          <LoadingSkeleton className="h-full w-full" />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell noPadding>
        <ErrorState title="Lỗi tải trò chuyện" description={error} onRetry={loadChatThreads} />
      </AppShell>
    )
  }

  return (
    <AppShell noPadding showRightSidebar={false}>
      {/* Active Call Modal/Overlay */}
      <Dialog open={isCallActive} onOpenChange={setIsCallActive}>
        <DialogContent
          showCloseButton={false}
          className="max-w-none w-screen h-[100dvh] p-0 bg-black border-none rounded-none translate-x-0 translate-y-0 top-0 left-0 fixed inset-0 z-[100] flex flex-col focus:outline-none"
        >
          <DialogTitle className="sr-only">Cuộc gọi video</DialogTitle>
          {activeCallToken && (
            <LiveKitRoomWrapper
              token={activeCallToken}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || ""}
              connect={true}
              video={activeCallType === "video"}
              audio={true}
              onDisconnected={handleDisconnect}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex h-[calc(100vh-4rem)] sm:h-[calc(100dvh-4rem)] bg-background overflow-hidden min-w-0 w-full max-w-full supports-[height:100dvh]:h-[calc(100dvh-4rem)]">
        <div
          className={`${showThreads ? "w-full" : "w-0"} md:w-80 md:flex flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden h-full min-w-0`}
        >
          <div className="p-3 sm:p-4 border-b border-border flex-shrink-0 min-w-0">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold truncate min-w-0">Tin nhắn</h2>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative min-w-0">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 h-8 sm:h-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0" asChild>
            <div className="p-1.5 sm:p-2 space-y-1">
              {filteredThreads.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted-foreground">
                  <p className="text-xs sm:text-sm">
                    {searchQuery.trim()
                      ? `Không tìm thấy cuộc trò chuyện nào với "${searchQuery}"`
                      : "Chưa có cuộc trò chuyện nào"}
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const info = getThreadInfo(thread)
                  return (
                    <div
                      key={thread.id}
                      className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                        activeThread?.id === thread.id ? "bg-accent" : ""
                      }`}
                      onClick={() => selectThread(thread)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12 sm:h-12 sm:w-12">
                            <AvatarImage src={info.avatar} />
                            <AvatarFallback className="text-sm">{info.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {info.isActive && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-green-500 border-2 border-background rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between mb-0.5 sm:mb-1 gap-1 sm:gap-2">
                            <p
                              className={`truncate text-[15px] sm:text-[15px] flex-1 ${thread.unreadCount > 0 ? "font-semibold" : "font-medium"}`}
                            >
                              {info.name}
                            </p>
                            <span className="text-[11px] sm:text-xs text-muted-foreground flex-shrink-0 ml-1 sm:ml-2 whitespace-nowrap">
                              {thread.lastMessage?.timestamp
                                ? formatDistanceToNow(new Date(thread.lastMessage.timestamp), {
                                    addSuffix: true,
                                    locale: vi,
                                  })
                                : ""}
                            </span>
                          </div>
                          <p
                            className={`text-[13px] sm:text-[13px] truncate ${
                              activeCalls[thread.id]
                                ? "text-green-600 font-medium flex items-center"
                                : thread.unreadCount > 0
                                  ? "font-semibold text-foreground"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {activeCalls[thread.id] ? (
                              <>
                                <Video className="w-3 h-3 mr-1 inline" /> Cuộc gọi đang diễn ra
                              </>
                            ) : thread.lastMessage ? (
                              thread.type === "group" && thread.lastMessage.senderId !== currentUser?.id ? (
                                `${thread.participants.find((p) => p.id === thread.lastMessage!.senderId)?.displayName || "Ai đó"}: ${thread.lastMessage.content}`
                              ) : (
                                thread.lastMessage.content
                              )
                            ) : (
                              "Chưa có tin nhắn"
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          {activeCalls[thread.id] && (
                            <Button
                              size="sm"
                              className="h-7 text-[11px] px-3 bg-green-500 hover:bg-green-600 text-white border-0 rounded-full shadow-sm animate-in fade-in zoom-in"
                              onClick={(e) => {
                                e.stopPropagation()
                                joinExistingCall(activeCalls[thread.id])
                              }}
                            >
                              Tham gia
                            </Button>
                          )}
                          {thread.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="h-5 w-5 sm:h-5 sm:min-w-5 text-[10px] sm:text-xs flex-shrink-0 p-0 flex items-center justify-center rounded-full"
                            >
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <div
          className={`${!showThreads ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 bg-background h-full overflow-hidden`}
        >
          {activeThread ? (
            <>
              {/* Header - Sticky ở top */}
              {/* Header - Sticky ở top */}
              <div className="sticky top-0 z-10 px-3 py-2 sm:px-4 sm:py-3 border-b border-border/50 flex items-center gap-3 flex-shrink-0 backdrop-blur-md bg-background/80 supports-[backdrop-filter]:bg-background/60 min-w-0 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden h-8 w-8 p-0 flex-shrink-0 -ml-1 mr-1"
                  onClick={backToThreads}
                >
                  <ArrowLeft className="h-5 w-5 text-primary" />
                </Button>
                <div
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-muted/50 p-1.5 -ml-1.5 rounded-lg transition-colors group"
                  onClick={toggleChatDetails}
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 border border-border/50 group-hover:border-border transition-colors">
                      <AvatarImage src={getThreadInfo(activeThread).avatar} />
                      <AvatarFallback className="text-sm font-medium">
                        {getThreadInfo(activeThread).name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {getThreadInfo(activeThread).isActive && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-semibold truncate text-[16px] leading-tight">
                      {getThreadInfo(activeThread).name}
                    </h3>
                    {activeThread.type === "group" ? (
                      <p
                        className={`text-[12px] truncate leading-tight ${activeCalls[activeThread.id] ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                      >
                        {activeCalls[activeThread.id]
                          ? "Cuộc gọi đang diễn ra"
                          : `${activeThread.participants.length} thành viên`}
                      </p>
                    ) : (
                      <p
                        className={`text-[12px] truncate leading-tight ${activeCalls[activeThread.id] ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                      >
                        {activeCalls[activeThread.id]
                          ? "Cuộc gọi đang diễn ra"
                          : getThreadInfo(activeThread).isActive
                            ? "Đang hoạt động"
                            : "Hoạt động gần đây"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Audio, Video, Info */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {/* Join Call Button in Header */}
                  {/* Join Call Button in Header */}
                  {activeCalls[activeThread.id] ? (
                    <Button
                      size="sm"
                      className="h-8 sm:h-9 text-xs px-3 bg-green-500 hover:bg-green-600 text-white border-0 rounded-full shadow-sm animate-in fade-in zoom-in mr-1"
                      onClick={() => joinExistingCall(activeCalls[activeThread.id])}
                    >
                      <Video className="w-4 h-4 mr-1.5" /> Tham gia
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        title="Gọi thoại"
                        onClick={() => startCall("audio")}
                        disabled={creatingCall}
                      >
                        <Phone className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full text-primary hover:bg-primary/10 transition-colors"
                        title="Gọi video"
                        onClick={() => startCall("video")}
                        disabled={creatingCall}
                      >
                        <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                      </Button>
                    </>
                  )}
                  {/* Info Button (Visual only for now) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full text-primary hover:bg-primary/10 transition-colors ${showChatDetails ? "bg-primary/10" : ""}`}
                    title="Thông tin"
                    onClick={toggleChatDetails}
                  >
                    <div className="w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full border-2 border-current flex items-center justify-center font-bold text-[12px]">
                      i
                    </div>
                  </Button>
                </div>
              </div>

              {/* Messages area - Chiếm không gian còn lại, scrollable */}
              <ScrollArea className="flex-1 min-h-0 overflow-y-auto" asChild>
                <div className="p-2 sm:p-4">
                  <div className="flex flex-col space-y-4 pb-2">
                    {/* Memoized Group Rendering */}
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date} className="space-y-4">
                        <div className="flex items-center justify-center my-4">
                          <Badge variant="outline" className="bg-muted/50 text-xs font-normal">
                            {new Date(date).toLocaleDateString("vi-VN", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {msgs.map((message, index) => {
                            const isCurrentUser = message.senderId === (currentUser?.id || "current-user")
                            const isMobile = typeof window !== "undefined" && window.innerWidth < 768

                            const previousMessage = index > 0 ? msgs[index - 1] : undefined
                            const nextMessage = index < msgs.length - 1 ? msgs[index + 1] : undefined

                            const isNextFromSameUser = nextMessage && nextMessage.senderId === message.senderId
                            const isPrevFromSameUser = previousMessage && previousMessage.senderId === message.senderId

                            // Grouping Logic Refined
                            // 1. Break grouping if Time Gap > 5 mins
                            const isTimeGap =
                              isPrevFromSameUser &&
                              previousMessage &&
                              new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() >
                                5 * 60 * 1000
                            const isTimeGapNext =
                              isNextFromSameUser &&
                              nextMessage &&
                              new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() >
                                5 * 60 * 1000

                            // 2. Break grouping if Reply is involved (Current is Reply OR Previous was Reply)
                            // A Reply starts a new visual block, and ends the previous one.
                            const isReplyBreak = !!message.replyTo || !!previousMessage?.replyTo
                            const isReplyBreakNext = !!nextMessage?.replyTo

                            // isGrouped: Same User + No Time Gap + No Reply Break involved
                            const isGrouped = isPrevFromSameUser && !isTimeGap && !isReplyBreak

                            // showAvatar: Not Current User AND ( End of Group OR Time Gap Next OR Next is Reply Break )
                            // If next message is a reply, we MUST show avatar because the reply will visually detach.
                            const showAvatar =
                              !isCurrentUser && (!isNextFromSameUser || isTimeGapNext || isReplyBreakNext)

                            return (
                              <ChatMessageItem
                                key={message.id}
                                message={message}
                                isCurrentUser={isCurrentUser}
                                isMobile={isMobile}
                                isGrouped={!!isGrouped}
                                showAvatar={showAvatar}
                                isGroupChat={activeThread?.type === "group"} // Pass group chat status
                                onReply={() => setReplyTo(message)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {/* Typing Indicator (Messenger Style) */}
                    {Array.from(typingUsers).map((userId) => {
                      const user = activeThread.participants.find((p) => p.id === userId)
                      // If 1-1 chat, we know who it is, but safe to find user.
                      // Use placeholder if user not found (rare)
                      const avatarSrc = user?.avatar || getThreadInfo(activeThread).avatar
                      const displayName = user?.displayName

                      return (
                        <div key={userId} className="flex items-end gap-2 mt-2 ml-1 animate-in fade-in duration-300">
                          {/* Avatar */}
                          <Avatar className="h-8 w-8 mb-1 border border-border">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="text-xs">{displayName?.[0] || "?"}</AvatarFallback>
                          </Avatar>

                          {/* Bubble with 3 Dots */}
                          <div className="bg-muted rounded-2xl p-3 h-10 flex items-center gap-1 w-16 justify-center">
                            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      )
                    })}

                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </ScrollArea>

              {/* Chat Input Component */}
              <ChatInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onFileSelect={handleFileSelect}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4 sm:p-8 min-w-0">
              <div className="text-center max-w-sm px-2 sm:px-0">
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">Chọn cuộc trò chuyện</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Details Sidebar */}
        {activeThread && showChatDetails && (
          <div className="w-full h-full fixed inset-0 z-50 bg-background xl:relative xl:h-auto xl:w-80 xl:flex-shrink-0 xl:border-l xl:border-border xl:bg-card xl:block xl:z-auto overflow-y-auto animate-in slide-in-from-right-10 duration-300">
            <div className="sticky top-0 z-10 flex items-center p-4 border-b border-border xl:hidden bg-background/95 backdrop-blur-sm">
              <Button variant="ghost" size="icon" onClick={() => setShowChatDetails(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="ml-4 font-semibold text-lg">Thông tin đoạn chat</h2>
            </div>
            <div className="p-6 flex flex-col items-center border-b border-border/50">
              <Avatar className="h-24 w-24 mb-4 border-4 border-background shadow-lg">
                <AvatarImage src={getThreadInfo(activeThread).avatar} />
                <AvatarFallback className="text-2xl">{getThreadInfo(activeThread).name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold text-center mb-1">{getThreadInfo(activeThread).name}</h2>
              {activeThread.type === "group" ? (
                <p className="text-sm text-muted-foreground">{activeThread.participants.length} thành viên</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {getThreadInfo(activeThread).isActive ? "Đang hoạt động" : "Offline"}
                </p>
              )}

              <div className="flex gap-4 mt-6 w-full justify-center">
                <div
                  className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={viewProfile}
                >
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    {activeThread.type === "group" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {activeThread.type === "group" ? "Trang nhóm" : "Trang cá nhân"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">Tắt thông báo</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">Tìm kiếm</span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-1">
              <Button variant="ghost" className="w-full justify-between font-medium h-12">
                <span>Tùy chỉnh đoạn chat</span>
                <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
              </Button>
              <Button variant="ghost" className="w-full justify-between font-medium h-12">
                <span>File phương tiện & file</span>
                <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
              </Button>
              <Button variant="ghost" className="w-full justify-between font-medium h-12">
                <span>Quyền riêng tư & hỗ trợ</span>
                <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
