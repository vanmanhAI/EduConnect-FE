"use client"

import { useEffect, useState, useCallback } from "react"
import {
  initNotificationSocket,
  onNotificationEvent,
  markNotificationRead as socketMarkNotificationRead,
  disconnectNotificationSocket,
} from "@/lib/socket-notifications"
import type { NotificationPayload } from "@/types/notification"
import { useAuth } from "@/contexts/auth-context"

interface UseNotificationSocketReturn {
  notifications: NotificationPayload[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  isConnected: boolean
}

/**
 * Reusable hook để lắng nghe notification events
 * Tự động cleanup khi unmount
 */
export const useNotificationSocket = (): UseNotificationSocketReturn => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const markAsRead = useCallback((notificationId: string) => {
    socketMarkNotificationRead(notificationId)
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    // Khởi tạo socket
    const socket = initNotificationSocket()
    if (!socket) {
      return
    }

    setIsConnected(socket.connected)

    // Lắng nghe connection events
    const handleConnect = () => {
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    const handleNewNotification = (data: { notification: NotificationPayload }) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === data.notification.id)) {
          return prev
        }
        const newNotification = { ...data.notification, isRead: false }
        return [newNotification, ...prev]
      })
    }

    socket.on("new_notification", handleNewNotification)
    const cleanupNewNotification = onNotificationEvent("new_notification", handleNewNotification)

    // Cleanup
    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("new_notification", handleNewNotification)
      cleanupNewNotification()
      // Không disconnect socket ở đây vì có thể đang dùng ở nơi khác
    }
  }, [user])

  // NotificationPayload từ socket có thể không có isRead, mặc định là false
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    isConnected,
  }
}
