"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { VideoCallModal } from "@/components/features/video/video-call-modal"
import { api } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Video, Phone, Search, Plus } from "lucide-react"
import type { User } from "@/types"

export default function VideoPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [callType, setCallType] = useState<"audio" | "video">("video")

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const data = await api.getUsers()
        setUsers(data.filter((user) => user.isOnline)) // Show only online users
      } catch (err) {
        console.error("Failed to load users:", err)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))

  const startCall = (user: User, type: "audio" | "video") => {
    setSelectedUser(user)
    setCallType(type)
    setShowVideoCall(true)
  }

  const recentCalls = [
    {
      id: "1",
      user: users[0],
      type: "video" as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      duration: 1245, // seconds
      status: "completed" as const,
    },
    {
      id: "2",
      user: users[1],
      type: "audio" as const,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      duration: 0,
      status: "missed" as const,
    },
  ]

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-64" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Video & Cuộc gọi</h1>
            <p className="text-muted-foreground">Kết nối với cộng đồng qua video call</p>
          </div>
          <Button className="bg-educonnect-primary hover:bg-educonnect-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Tạo phòng họp
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Online Users */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Người dùng đang online</h2>
              <Badge variant="secondary">{filteredUsers.length} người</Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <EmptyState title="Không có ai online" description="Chưa có người dùng nào đang hoạt động" />
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => startCall(user, "audio")}>
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-educonnect-primary hover:bg-educonnect-primary/90"
                          onClick={() => startCall(user, "video")}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Recent Calls */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Cuộc gọi gần đây</h2>

            {recentCalls.length === 0 ? (
              <EmptyState title="Chưa có cuộc gọi nào" description="Lịch sử cuộc gọi sẽ hiển thị ở đây" />
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={call.user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{call.user?.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{call.user?.displayName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {call.type === "video" ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                        <span>
                          {formatDistanceToNow(call.timestamp, {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge variant={call.status === "completed" ? "secondary" : "destructive"} className="text-xs">
                      {call.status === "completed" ? "Hoàn thành" : "Nhỡ"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Call Modal */}
        {showVideoCall && selectedUser && (
          <VideoCallModal
            isOpen={showVideoCall}
            onClose={() => setShowVideoCall(false)}
            participants={[selectedUser]}
            callType={callType}
          />
        )}
      </div>
    </AppShell>
  )
}
