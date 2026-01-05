"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useNotificationSocket } from "@/hooks/use-notification-socket"
import { showNotificationToast } from "./notification-toast"
import type { NotificationPayload } from "@/types/notification"
import { shouldShowNotification, getNotificationPriority } from "@/lib/notifications/notification-filter"
import { notificationQueue } from "@/lib/notifications/notification-queue"
import { soundManager } from "@/lib/notifications/sound-manager"

interface NotificationContextValue {
  notifications: NotificationPayload[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  isConnected: boolean
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const useNotificationContext = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

/**
 * NotificationProvider quản lý notifications globally
 * Sử dụng queue system, smart filtering, và sound/vibration
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const { notifications: socketNotifications, markAsRead, isConnected } = useNotificationSocket()

  // Track active conversation để filter notifications
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  // Track tab active state
  const [isTabActive, setIsTabActive] = useState(true)

  // Track notification đã hiển thị để tránh duplicate
  const displayedNotificationIds = useRef<Set<string>>(new Set())

  // Load notifications từ API để tính unreadCount chính xác
  const [apiNotifications, setApiNotifications] = useState<NotificationPayload[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  // Merge notifications từ socket và API
  const [allNotifications, setAllNotifications] = useState<NotificationPayload[]>([])

  // Tính unreadCount từ cả API và socket
  const unreadCount = allNotifications.filter((n) => !n.isRead).length

  // Load notifications từ API để sync unreadCount
  useEffect(() => {
    const loadNotifications = async () => {
      if (!isConnected) return

      try {
        setIsLoadingNotifications(true)
        const { api } = await import("@/lib/api")
        const data = await api.getNotifications()

        // Convert Notification[] sang NotificationPayload[]
        const payloads: NotificationPayload[] = data.map((n) => ({
          id: n.id,
          userId: "", // API Notification không có userId, sẽ lấy từ context
          type: n.type,
          title: n.title,
          message: n.message,
          actionUrl: n.actionUrl,
          actorId: n.actorId,
          createdAt: n.createdAt,
          isRead: n.isRead,
          readAt: n.readAt,
          actor: n.actor
            ? {
                id: n.actor.id,
                displayName: n.actor.displayName,
                avatar: n.actor.avatar || undefined,
                username: n.actor.username,
              }
            : undefined,
        }))

        setApiNotifications(payloads)
      } catch (error) {
        console.error("Lỗi khi load notifications:", error)
      } finally {
        setIsLoadingNotifications(false)
      }
    }

    loadNotifications()

    // Reload mỗi 30 giây để sync
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [isConnected])

  // Merge notifications từ socket và API
  // Chỉ merge để tính unreadCount, KHÔNG hiển thị lại notifications cũ từ API
  useEffect(() => {
    const merged = [...socketNotifications]

    // Thêm notifications từ API chưa có trong socket (chỉ để tính unreadCount)
    apiNotifications.forEach((apiNotif) => {
      if (!merged.some((n) => n.id === apiNotif.id)) {
        merged.push(apiNotif)
      } else {
        // Update notification từ API nếu có thông tin mới hơn (isRead status)
        const index = merged.findIndex((n) => n.id === apiNotif.id)
        if (index !== -1) {
          merged[index] = { ...merged[index], isRead: apiNotif.isRead ?? merged[index].isRead }
        }
      }
    })

    // Sort by createdAt DESC
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setAllNotifications(merged)

    // Đánh dấu tất cả notifications từ API là đã hiển thị (để không hiển thị lại toast)
    // Chỉ hiển thị notifications MỚI từ socket real-time
    apiNotifications.forEach((apiNotif) => {
      displayedNotificationIds.current.add(apiNotif.id)
    })
  }, [socketNotifications, apiNotifications])

  // Track tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    setIsTabActive(!document.hidden)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // KHÔNG hiển thị lại notifications cũ từ API
  // Chỉ hiển thị notifications MỚI từ socket real-time

  // Xử lý khi có notification MỚI từ socket - CHỈ xử lý socket notifications
  // KHÔNG xử lý notifications từ API (để tránh hiển thị lại notifications cũ)
  const previousSocketNotificationsRef = useRef<NotificationPayload[]>([])

  useEffect(() => {
    // Chỉ xử lý notifications từ socket, không xử lý từ API
    if (socketNotifications.length === 0) {
      previousSocketNotificationsRef.current = []
      return
    }

    // Tìm notifications MỚI từ socket (chưa có trong previous)
    const previousIds = new Set(previousSocketNotificationsRef.current.map((n) => n.id))
    const newSocketNotifications = socketNotifications.filter((n) => !previousIds.has(n.id))
    previousSocketNotificationsRef.current = socketNotifications

    if (newSocketNotifications.length === 0) {
      return
    }

    // Xử lý notification mới nhất từ socket
    const latestNotification = newSocketNotifications[0]

    // Kiểm tra đã hiển thị chưa
    if (displayedNotificationIds.current.has(latestNotification.id)) {
      return
    }

    const filterContext = {
      currentPath: pathname,
      activeConversationId: activeConversationId || undefined,
      isTabActive,
    }

    const shouldShow = shouldShowNotification(latestNotification, filterContext)

    if (shouldShow) {
      displayedNotificationIds.current.add(latestNotification.id)
      const priority = getNotificationPriority(latestNotification)
      notificationQueue.enqueue(latestNotification, priority)
      soundManager.playNotification(latestNotification.type)
    }
  }, [socketNotifications, pathname, activeConversationId, isTabActive])

  // Mark as read và sync với API
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      // Update local state ngay lập tức (optimistic update)
      setAllNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)))

      // Mark via socket
      markAsRead(notificationId)

      // Sync với API (không block UI)
      try {
        const { api } = await import("@/lib/api")
        await api.markNotificationRead(notificationId)

        // Reload để sync (chạy background, không block)
        api
          .getNotifications()
          .then((data) => {
            const payloads: NotificationPayload[] = data.map((n) => ({
              id: n.id,
              userId: "",
              type: n.type,
              title: n.title,
              message: n.message,
              actionUrl: n.actionUrl,
              actorId: n.actorId,
              createdAt: n.createdAt,
              isRead: n.isRead,
              readAt: n.readAt,
              actor: n.actor
                ? {
                    id: n.actor.id,
                    displayName: n.actor.displayName,
                    avatar: n.actor.avatar || undefined,
                    username: n.actor.username,
                  }
                : undefined,
            }))
            setApiNotifications(payloads)
          })
          .catch((error) => {
            console.error("Lỗi khi reload notifications:", error)
          })
      } catch (error) {
        console.error("Lỗi khi mark notification as read:", error)
      }
    },
    [markAsRead]
  )

  // Xử lý hành vi khi click notification theo từng loại
  // Ưu tiên actionUrl, fallback về logic cụ thể theo type
  const handleNotificationClick = useCallback(
    (notification: NotificationPayload) => {
      // Mark as read (không block navigation)
      handleMarkAsRead(notification.id).catch((error) => {
        console.error("Lỗi khi mark as read:", error)
      })

      // Xác định URL để navigate
      let targetUrl: string | null = null

      // Ưu tiên actionUrl nếu có
      if (notification.actionUrl) {
        // Fix cho chat URL từ backend (/chat/id -> /chat?conversationId=id)
        if (notification.actionUrl.startsWith("/chat/") && notification.actionUrl.split("/").length === 3) {
          const conversationId = notification.actionUrl.split("/")[2]
          targetUrl = `/chat?conversationId=${conversationId}`
        } else {
          targetUrl = notification.actionUrl
        }
      } else {
        // Fallback logic theo từng type
        switch (notification.type) {
          case "message":
            // Nếu notification có context conversationId (thường backend sẽ gửi kèm hoặc trong data custom)
            // Tuy nhiên type NotificationPayload hiện tại chưa chắc có.
            // Nhưng nếu fallback về /chat cũng tạm ổn.
            targetUrl = "/chat"
            break

          case "follow":
            targetUrl = notification.actorId ? `/users/${notification.actorId}` : "/people"
            break

          case "like":
          case "comment":
          case "mention":
            targetUrl = "/feed"
            break

          case "group_invite":
            targetUrl = "/groups"
            break

          case "badge":
          case "achievement":
            targetUrl = "/profile?tab=achievements"
            break

          case "system":
            targetUrl = "/"
            break

          default:
            targetUrl = "/"
        }
      }

      // Navigate
      if (targetUrl) {
        try {
          router.push(targetUrl)
        } catch (error) {
          console.error("Lỗi khi navigate:", error)
        }
      }
    },
    [handleMarkAsRead, router]
  )

  // Lắng nghe event từ queue để hiển thị toast
  useEffect(() => {
    const handleShowNotification = (event: CustomEvent<NotificationPayload>) => {
      const notification = event.detail
      showNotificationToast({
        notification,
        onClick: () => handleNotificationClick(notification),
        duration: 5000,
      })
    }

    window.addEventListener("show-notification", handleShowNotification as EventListener)
    return () => {
      window.removeEventListener("show-notification", handleShowNotification as EventListener)
    }
  }, [router, handleNotificationClick])

  // BroadcastChannel để sync giữa các tabs
  useEffect(() => {
    if (typeof window === "undefined") return

    const channel = new BroadcastChannel("notifications")

    channel.onmessage = (event) => {
      if (event.data.type === "notification") {
        // Có thể xử lý sync notifications giữa các tabs ở đây
      }
    }

    if (allNotifications.length > 0) {
      const latest = allNotifications[0]
      if (!displayedNotificationIds.current.has(latest.id)) {
        channel.postMessage({
          type: "notification",
          notification: latest,
        })
      }
    }

    return () => {
      channel.close()
    }
  }, [socketNotifications])

  const value: NotificationContextValue = {
    notifications: allNotifications,
    unreadCount,
    markAsRead: handleMarkAsRead,
    isConnected,
    activeConversationId,
    setActiveConversationId,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
