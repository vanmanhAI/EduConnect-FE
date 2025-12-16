"use client"

import { io, Socket } from "socket.io-client"
import { tokenManager } from "@/lib/auth"
import type { NotificationPayload } from "@/types/notification"

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
let notificationSocket: Socket | null = null

export interface NotificationSocketEvents {
  // Client -> Server events
  subscribe_notifications: () => void
  mark_notification_read: (data: { notificationId: string }) => void

  // Server -> Client events
  subscribed_notifications: (data: { userId: string; timestamp: Date }) => void
  new_notification: (data: { notification: NotificationPayload }) => void
  notification_marked_read: (data: { notificationId: string; timestamp: Date }) => void
  error: (error: { event: string; message: string }) => void
}

/**
 * Khởi tạo notification socket connection
 * Tái sử dụng pattern từ socket.ts
 */
export const initNotificationSocket = (token?: string): Socket | null => {
  if (notificationSocket && notificationSocket.connected) {
    return notificationSocket
  }

  if (notificationSocket && !notificationSocket.connected) {
    notificationSocket.disconnect()
  }

  const authToken = token || tokenManager.getToken()

  if (!authToken) {
    console.error("Không có token để kết nối notification socket")
    return null
  }

  const url = `${SOCKET_URL}/notifications`

  notificationSocket = io(url, {
    auth: {
      token: authToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    forceNew: true,
  })

  notificationSocket.on("connect", () => {
    subscribeNotifications()
    setTimeout(() => subscribeNotifications(), 500)
  })

  notificationSocket.on("connect_error", (error: any) => {
    console.error("Notification socket connection error:", error?.message || error)
  })

  notificationSocket.on("error", (error) => {
    console.error("Notification socket error:", error)
  })

  return notificationSocket
}

/**
 * Lấy notification socket instance hiện tại
 */
export const getNotificationSocket = (): Socket | null => {
  return notificationSocket
}

/**
 * Ngắt kết nối notification socket
 */
export const disconnectNotificationSocket = () => {
  if (notificationSocket) {
    notificationSocket.disconnect()
    notificationSocket = null
  }
}

/**
 * Subscribe để nhận notifications
 */
export const subscribeNotifications = () => {
  if (!notificationSocket) {
    return
  }

  if (!notificationSocket.connected) {
    notificationSocket.once("connect", () => {
      if (notificationSocket) {
        notificationSocket.emit("subscribe_notifications")
      }
    })
    return
  }

  notificationSocket.emit("subscribe_notifications")
}

/**
 * Đánh dấu notification đã đọc
 */
export const markNotificationRead = (notificationId: string) => {
  if (!notificationSocket || !notificationSocket.connected) {
    return
  }
  notificationSocket.emit("mark_notification_read", { notificationId })
}

/**
 * Lắng nghe event từ server
 */
export const onNotificationEvent = <K extends keyof NotificationSocketEvents>(
  event: K,
  callback: NotificationSocketEvents[K]
) => {
  if (!notificationSocket) {
    return () => {}
  }

  notificationSocket.on(event as string, callback as any)

  return () => {
    if (notificationSocket) {
      notificationSocket.off(event as string, callback as any)
    }
  }
}

/**
 * Hủy lắng nghe event
 */
export const offNotificationEvent = <K extends keyof NotificationSocketEvents>(
  event: K,
  callback?: NotificationSocketEvents[K]
) => {
  if (!notificationSocket) {
    return
  }

  if (callback) {
    notificationSocket.off(event as string, callback as any)
  } else {
    notificationSocket.off(event as string)
  }
}
