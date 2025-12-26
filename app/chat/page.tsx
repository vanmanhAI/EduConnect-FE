"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
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
import { Send, Search, Plus, Paperclip, ArrowLeft } from "lucide-react"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentRoomRef = useRef<string | null>(null)
  const activeThreadIdRef = useRef<string | null>(null) // Ref để tránh stale closure

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
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [messages])

  const loadChatThreads = async () => {
    try {
      setLoading(true)
      const data = await api.getChatThreads()
      setThreads(data)

      // Kiểm tra conversationId từ query params
      const conversationIdFromUrl = searchParams.get("conversationId")
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
      } else if (data.length > 0 && !activeThread) {
        // Nếu không có conversationId trong URL, chọn conversation đầu tiên
        setActiveThread(data[0])
      }

      if (socketConnected && getSocket()) {
        for (const thread of data) {
          joinRoom(thread.id)
        }
      }
    } catch (err) {
      setError("Không thể tải danh sách trò chuyện")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      setMessages([])
      const data = await api.getChatMessages(threadId)
      if (data && data.length > 0) {
        setMessages(data)
      }
    } catch (err) {
      console.error("Failed to load messages:", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return

    const socket = getSocket()
    const messageContent = newMessage.trim()

    // Try to send via Socket.IO first
    if (socket && socketConnected) {
      try {
        sendSocketMessage({
          conversationId: activeThread.id,
          content: messageContent,
          type: "text",
        })
        setNewMessage("")
        // Stop typing indicator
        emitTyping(activeThread.id, false)
        setIsTyping(false)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = null
        }
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
      }

      await api.sendMessage(message)
      setNewMessage("")
      loadMessages(activeThread.id)
      loadChatThreads()
    } catch (err) {
      console.error("Failed to send message:", err)
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activeThread) {
      // Mock file upload - in real app would upload to server
      const message: Omit<ChatMessage, "id"> = {
        threadId: activeThread.id,
        senderId: "current-user",
        sender: { id: "current-user", displayName: "Bạn" } as any,
        conversationId: activeThread.id,
        content: `Đã gửi file: ${file.name}`,
        timestamp: new Date(),
        createdAt: new Date(),
        type: "file",
        isRead: true,
      }

      api.sendMessage(message).then(() => {
        loadMessages(activeThread.id)
        loadChatThreads()
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    if (!activeThread || !socketConnected) return

    const socket = getSocket()
    if (!socket) return

    // Emit typing start
    if (!isTyping) {
      setIsTyping(true)
      emitTyping(activeThread.id, true)
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(activeThread.id, false)
      setIsTyping(false)
      typingTimeoutRef.current = null
    }, 2000)
  }

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
    .map((thread) => {
      // Trong direct chat, loại bỏ currentUser khỏi participants để hiển thị
      if (thread.type === "direct" && currentUser?.id) {
        const filteredParticipants = thread.participants.filter((p) => p.id !== currentUser.id)
        return {
          ...thread,
          participants: filteredParticipants.length > 0 ? filteredParticipants : thread.participants,
        }
      }
      return thread
    })
    .filter((thread) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        thread.participants.some((p) => (p.displayName || p.name || "").toLowerCase().includes(query)) ||
        (thread.lastMessage?.content || "").toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      // Sort theo lastMessage timestamp (mới nhất trước)
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
      <AppShell>
        <div className="flex h-full">
          <LoadingSkeleton className="h-full w-full" />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <ErrorState title="Lỗi tải trò chuyện" description={error} onRetry={loadChatThreads} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden -mx-4 -my-6 px-0 py-0">
        <div
          className={`${showThreads ? "w-full" : "w-0"} md:w-80 md:flex flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden h-full`}
        >
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tin nhắn</h2>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">
                    {searchQuery.trim()
                      ? `Không tìm thấy cuộc trò chuyện nào với "${searchQuery}"`
                      : "Chưa có cuộc trò chuyện nào"}
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                      activeThread?.id === thread.id ? "bg-accent" : ""
                    }`}
                    onClick={() => selectThread(thread)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={thread.participants[0]?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-sm">
                            {thread.participants[0]?.displayName?.charAt(0)?.toUpperCase() ||
                              thread.participants[0]?.name?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </AvatarFallback>
                        </Avatar>
                        {thread.participants[0]?.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`truncate text-sm ${thread.unreadCount > 0 ? "font-semibold" : "font-medium"}`}>
                            {thread.participants.length > 0
                              ? thread.participants.map((p) => p.displayName || p.name || "Người dùng").join(", ")
                              : "Cuộc trò chuyện"}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {thread.lastMessage?.timestamp
                              ? formatDistanceToNow(new Date(thread.lastMessage.timestamp), {
                                  addSuffix: true,
                                  locale: vi,
                                })
                              : ""}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            thread.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {thread.lastMessage?.content || "Chưa có tin nhắn"}
                        </p>
                      </div>
                      {thread.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-5 text-xs flex-shrink-0">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
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
              <div className="sticky top-0 z-10 p-4 border-b border-border flex items-center gap-3 flex-shrink-0 backdrop-blur-sm bg-card/95">
                <Button variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0" onClick={backToThreads}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={activeThread.participants[0]?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-sm">
                    {activeThread.participants[0]?.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate text-sm">
                    {activeThread.participants.map((p) => p.displayName).join(", ")}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeThread.participants[0]?.isOnline ? "Đang hoạt động" : "Không hoạt động"}
                  </p>
                </div>
              </div>

              {/* Messages area - Chiếm không gian còn lại, scrollable */}
              <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUser?.id || message.senderId === "current-user"
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2 max-w-[80%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                          {!isCurrentUser && (
                            <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
                              <AvatarImage src={activeThread.participants[0]?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {activeThread.participants[0]?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-3 py-2 rounded-2xl ${
                              isCurrentUser
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm break-words">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {formatDistanceToNow(new Date(message.timestamp), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                      <span>Đang soạn tin nhắn...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area - Sticky ở bottom */}
              <div className="sticky bottom-0 z-10 p-4 border-t border-border flex-shrink-0 backdrop-blur-sm bg-card/95">
                <div className="flex items-end gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="*/*" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 w-9 p-0 flex-shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      onBlur={() => {
                        if (activeThread && socketConnected) {
                          emitTyping(activeThread.id, false)
                          setIsTyping(false)
                        }
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current)
                          typingTimeoutRef.current = null
                        }
                      }}
                      className="pr-12 h-9"
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="h-9 w-9 p-0 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <h3 className="text-lg font-medium mb-2">Chọn cuộc trò chuyện</h3>
                <p className="text-muted-foreground text-sm">
                  Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
