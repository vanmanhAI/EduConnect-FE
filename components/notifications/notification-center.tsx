"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, X, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotificationContext } from "./notification-provider"
import { getNotificationIcon, getNotificationColor } from "@/lib/notifications/utils"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Notification } from "@/types"

/**
 * Notification Center Component
 * Hiển thị tất cả notifications, có thể xem lại và quản lý
 */
export const NotificationCenter = () => {
  const router = useRouter()
  const { unreadCount, markAsRead, notifications: socketNotifications } = useNotificationContext()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  // Load notifications từ API khi mở center
  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open])

  // Merge notifications từ socket và API
  useEffect(() => {
    if (socketNotifications.length > 0) {
      const socketNotificationsAsNotification: Notification[] = socketNotifications.map((n) => ({
        ...n,
        isRead: n.isRead ?? false,
        actor: n.actor
          ? ({
              id: n.actor.id,
              displayName: n.actor.displayName,
              avatar: n.actor.avatar,
              username: n.actor.username,
            } as any)
          : undefined,
      }))

      // Merge với notifications từ API, ưu tiên socket notifications (mới hơn)
      setNotifications((prev) => {
        const merged = [...socketNotificationsAsNotification, ...prev]
        // Remove duplicates (ưu tiên socket notifications)
        const unique = merged.filter((n, index, self) => index === self.findIndex((t) => t.id === n.id))
        // Sort by createdAt DESC
        return unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      })
    }
  }, [socketNotifications])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read (không block navigation)
    markAsRead(notification.id)

    // Đóng notification center
    setOpen(false)

    // Xác định URL để navigate
    let targetUrl: string | null = null

    // Ưu tiên actionUrl nếu có
    if (notification.actionUrl) {
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
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 hover:bg-educonnect-primary/10">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Thông báo</SheetTitle>
              <SheetDescription>
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã đọc"}
              </SheetDescription>
            </div>
            {unreadNotifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8">
                <CheckCheck className="h-4 w-4 mr-1" />
                Đánh dấu tất cả
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const { Icon, className: iconClassName } = getNotificationIcon(notification.type)
                const colorClass = getNotificationColor(notification.type)

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.isRead && "bg-blue-50/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon className={iconClassName} />
                      </div>

                      {notification.actor && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={notification.actor.avatar || undefined} />
                          <AvatarFallback>
                            {notification.actor.displayName?.charAt(0) || notification.actor.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{notification.title}</p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
