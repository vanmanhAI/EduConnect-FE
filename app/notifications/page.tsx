"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Check, CheckCheck, Trash2, Heart, MessageCircle, UserPlus, Users, Award, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { formatDate, cn } from "@/lib/utils"
import type { Notification } from "@/types"

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "like":
      return <Heart className="h-4 w-4 text-red-500" />
    case "comment":
      return <MessageCircle className="h-4 w-4 text-blue-500" />
    case "follow":
      return <UserPlus className="h-4 w-4 text-green-500" />
    case "group_invite":
      return <Users className="h-4 w-4 text-purple-500" />
    case "badge":
      return <Award className="h-4 w-4 text-yellow-500" />
    case "mention":
      return <AtSign className="h-4 w-4 text-cyan-500" />
    default:
      return <Bell className="h-4 w-4 text-gray-500" />
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [markingRead, setMarkingRead] = useState(false)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getNotifications()
        setNotifications(data)
      } catch (err) {
        setError("Không thể tải thông báo. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingRead(true)
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    } finally {
      setMarkingRead(false)
    }
  }

  const handleSelectNotification = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(getFilteredNotifications().map((n) => n.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleBulkMarkAsRead = async () => {
    try {
      setMarkingRead(true)
      await Promise.all(selectedIds.map((id) => api.markNotificationRead(id)))
      setNotifications((prev) => prev.map((n) => (selectedIds.includes(n.id) ? { ...n, isRead: true } : n)))
      setSelectedIds([])
    } catch (error) {
      console.error("Failed to mark notifications as read:", error)
    } finally {
      setMarkingRead(false)
    }
  }

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.isRead)
      case "read":
        return notifications.filter((n) => n.isRead)
      default:
        return notifications
    }
  }

  const handleRetry = () => {
    setError(null)
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const data = await api.getNotifications()
        setNotifications(data)
      } catch (err) {
        setError("Không thể tải thông báo. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadNotifications()
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filteredNotifications = getFilteredNotifications()

  return (
    <AppShell showRightSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Bell className="h-6 w-6" />
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Theo dõi các hoạt động và cập nhật mới nhất</p>
          </div>

          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} disabled={markingRead} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedIds.length === filteredNotifications.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">{selectedIds.length} đã chọn</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleBulkMarkAsRead} disabled={markingRead}>
                <Check className="mr-2 h-4 w-4" />
                Đánh dấu đã đọc
              </Button>
              <Button size="sm" variant="outline">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Tất cả ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
            <TabsTrigger value="read">Đã đọc ({notifications.length - unreadCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && filteredNotifications.length === 0 && (
              <EmptyState
                icon={<Bell className="h-12 w-12" />}
                title={
                  activeTab === "unread"
                    ? "Không có thông báo mới"
                    : activeTab === "read"
                      ? "Không có thông báo đã đọc"
                      : "Chưa có thông báo nào"
                }
                description={
                  activeTab === "unread"
                    ? "Bạn đã xem hết tất cả thông báo"
                    : "Các thông báo sẽ xuất hiện ở đây khi có hoạt động mới"
                }
              />
            )}

            {!loading && !error && filteredNotifications.length > 0 && (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      "hover:shadow-sm transition-shadow cursor-pointer",
                      !notification.isRead && "bg-blue-50/50 border-blue-200"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={(checked) => handleSelectNotification(notification.id, checked as boolean)}
                        />

                        <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>

                        {notification.actor && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={notification.actor.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{notification.actor.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.createdAt)}</p>
                            </div>

                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="text-xs text-educonnect-primary hover:underline mt-2 inline-block"
                              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                            >
                              Xem chi tiết →
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
