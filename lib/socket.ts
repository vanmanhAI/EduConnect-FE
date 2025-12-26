"use client"

import { io, Socket } from "socket.io-client"
import { tokenManager } from "@/lib/auth"

const getSocketUrl = (): string => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  if (socketUrl) {
    return socketUrl.replace(/\/$/, "")
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE
  if (apiBase) {
    return apiBase.replace("/api/v1", "").replace(/\/$/, "")
  }

  return "http://localhost:3001"
}

const SOCKET_URL = getSocketUrl()

let socket: Socket | null = null

export interface SocketEvents {
  // Client -> Server events
  join_room: (data: { conversationId: string }) => void
  leave_room: (data: { conversationId: string }) => void
  send_message: (data: {
    conversationId: string
    content: string
    type?: string
    mentions?: string[]
    replyToId?: string
  }) => void
  typing: (data: { conversationId: string; isTyping: boolean }) => void
  mark_as_read: (data: { conversationId: string; messageId: string }) => void
  delete_message: (data: { conversationId: string; messageId: string }) => void
  edit_message: (data: { conversationId: string; messageId: string; content: string }) => void

  // Server -> Client events
  joined_room: (data: { conversationId: string }) => void
  left_room: (data: { conversationId: string }) => void
  new_message: (message: any) => void
  message_updated: (data: { conversationId: string; messageId: string; content: string; updatedAt: Date }) => void
  message_edited: (data: { conversationId: string; messageId: string; content: string; updatedAt: Date }) => void
  message_deleted: (data: { messageId: string; conversationId: string }) => void
  user_typing: (data: { conversationId: string; userId: string; isTyping: boolean }) => void
  typing_started: (data: { conversationId: string; userId: string }) => void
  typing_stopped: (data: { conversationId: string; userId: string }) => void
  conversation_read: (data: { userId: string; conversationId: string; unreadCount: number; timestamp: Date }) => void
  user_online: (data: { userId: string }) => void
  user_offline: (data: { userId: string }) => void
  error: (error: { event: string; message: string }) => void
}

/**
 * Khởi tạo socket connection
 */
export const initSocket = (token?: string): Socket | null => {
  // Nếu socket đã tồn tại và đang connected, return
  if (socket && socket.connected) {
    return socket
  }

  // Nếu socket đã tồn tại nhưng disconnected, disconnect trước
  if (socket && !socket.connected) {
    socket.disconnect()
  }

  // Lấy token nếu không được truyền vào
  const authToken = token || tokenManager.getToken()

  if (!authToken) {
    console.error("❌ Không có token để kết nối socket")
    return null
  }

  // Tạo socket connection mới
  socket = io(`${SOCKET_URL}/chat`, {
    auth: {
      token: authToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id)
  })

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason)
  })

  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error.message)
  })

  socket.on("error", (error) => {
    console.error("❌ Socket error:", error)
  })

  return socket
}

/**
 * Lấy socket instance hiện tại
 */
export const getSocket = (): Socket | null => {
  return socket
}

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Join conversation room
 */
export const joinRoom = (conversationId: string) => {
  if (!socket || !socket.connected) {
    console.warn("⚠️ Socket chưa kết nối, đang thử kết nối...")
    initSocket()
    return
  }

  socket.emit("join_room", { conversationId })
}

/**
 * Leave conversation room
 */
export const leaveRoom = (conversationId: string) => {
  if (!socket || !socket.connected) {
    return
  }

  socket.emit("leave_room", { conversationId })
}

/**
 * Gửi tin nhắn qua socket
 */
export const sendMessage = (data: {
  conversationId: string
  content: string
  type?: string
  mentions?: string[]
  replyToId?: string
}) => {
  if (!socket || !socket.connected) {
    console.error("❌ Socket chưa kết nối")
    return
  }

  socket.emit("send_message", {
    conversationId: data.conversationId,
    content: data.content,
    type: data.type || "text",
    mentions: data.mentions,
    replyToId: data.replyToId,
  })
}

/**
 * Typing indicator
 */
export const typing = (conversationId: string, isTyping: boolean) => {
  if (!socket || !socket.connected) {
    return
  }

  socket.emit("typing", { conversationId, isTyping })
}

/**
 * Đánh dấu tin nhắn đã đọc
 */
export const markAsRead = (conversationId: string, messageId: string) => {
  if (!socket || !socket.connected) {
    return
  }

  socket.emit("mark_as_read", { conversationId, messageId })
}

/**
 * Xóa tin nhắn
 */
export const deleteMessage = (conversationId: string, messageId: string) => {
  if (!socket || !socket.connected) {
    return
  }

  socket.emit("delete_message", { conversationId, messageId })
}

/**
 * Sửa tin nhắn
 */
export const editMessage = (conversationId: string, messageId: string, content: string) => {
  if (!socket || !socket.connected) {
    return
  }

  socket.emit("edit_message", { conversationId, messageId, content })
}

/**
 * Lắng nghe event từ server
 */
export const onEvent = <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => {
  if (!socket) {
    console.warn("⚠️ Socket chưa được khởi tạo")
    return () => {} // Return empty cleanup function
  }

  socket.on(event as string, callback as any)

  // Return cleanup function
  return () => {
    if (socket) {
      socket.off(event as string, callback as any)
    }
  }
}

/**
 * Hủy lắng nghe event
 */
export const offEvent = <K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) => {
  if (!socket) {
    return
  }

  if (callback) {
    socket.off(event as string, callback as any)
  } else {
    socket.off(event as string)
  }
}
