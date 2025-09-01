"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showThreads, setShowThreads] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadChatThreads()
  }, [])

  useEffect(() => {
    if (activeThread) {
      loadMessages(activeThread.id)
    }
  }, [activeThread])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadChatThreads = async () => {
    try {
      setLoading(true)
      const data = await api.getChatThreads()
      setThreads(data)
      if (data.length > 0 && !activeThread) {
        setActiveThread(data[0])
      }
    } catch (err) {
      setError("Không thể tải danh sách trò chuyện")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      const data = await api.getChatMessages(threadId)
      setMessages(data)
    } catch (err) {
      console.error("Failed to load messages:", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread) return

    const message: Omit<ChatMessage, "id"> = {
      threadId: activeThread.id,
      senderId: "current-user",
      sender: { id: "current-user", displayName: "Bạn" } as any,
      conversationId: activeThread.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      createdAt: new Date(),
      type: "text",
      isRead: true,
    }

    try {
      await api.sendMessage(message)
      setNewMessage("")
      loadMessages(activeThread.id)
      loadChatThreads()
    } catch (err) {
      console.error("Failed to send message:", err)
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

  const filteredThreads = threads.filter((thread) =>
    thread.participants.some((p) => p.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const selectThread = (thread: ChatThread) => {
    setActiveThread(thread)
    setShowThreads(false)
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
      <div className="flex h-full bg-background overflow-hidden">
        <div
          className={`${showThreads ? "w-full" : "w-0"} md:w-80 md:flex flex-col border-r border-border bg-card transition-all duration-300 overflow-hidden`}
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
              {filteredThreads.map((thread) => (
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
                        <AvatarFallback className="text-sm">{thread.participants[0]?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {thread.participants[0]?.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate text-sm">
                          {thread.participants.map((p) => p.displayName).join(", ")}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(thread.lastMessage.timestamp), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{thread.lastMessage.content}</p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 text-xs flex-shrink-0">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className={`${!showThreads ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0 bg-background`}>
          {activeThread ? (
            <>
              <div className="p-4 border-b border-border bg-card flex items-center gap-3 flex-shrink-0">
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

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === "current-user"
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
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border bg-card flex-shrink-0">
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
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
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
