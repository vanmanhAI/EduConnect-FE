"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Users, Settings, Share2, MoreHorizontal, Send, Smile, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { UserCard } from "@/components/features/users/user-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { formatNumber } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import type { Group, Post, User, ChatMessage } from "@/types"

export default function GroupDetailPage() {
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("posts")

  useEffect(() => {
    const loadGroupData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [groupData, groupPosts, groupMembers] = await Promise.all([
          api.getGroup(groupId),
          api.getPosts(groupId),
          api.getUsers(), // Mock: get all users as group members
        ])

        if (!groupData) {
          setError("Không tìm thấy nhóm")
          return
        }

        setGroup(groupData)
        setPosts(groupPosts)
        setMembers(groupMembers.slice(0, 10)) // Mock: first 10 users as members

        const groupMessages = await api.getChatMessages(`group-${groupId}`)
        setMessages(groupMessages)
      } catch (err) {
        setError("Không thể tải thông tin nhóm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      loadGroupData()
    }
  }, [groupId])

  const handleJoinToggle = async () => {
    if (!group) return

    try {
      if (group.joinStatus === "joined") {
        await api.leaveGroup(group.id)
        setGroup({ ...group, joinStatus: "not-joined", memberCount: group.memberCount - 1 })
      } else {
        await api.joinGroup(group.id)
        setGroup({
          ...group,
          joinStatus: group.isPrivate ? "pending" : "joined",
          memberCount: group.isPrivate ? group.memberCount : group.memberCount + 1,
        })
      }
    } catch (error) {
      console.error("Failed to toggle group membership:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !group) return

    const message: Omit<ChatMessage, "id"> = {
      threadId: `group-${group.id}`,
      senderId: "current-user",
      sender: { id: "current-user", displayName: "Bạn" } as any,
      conversationId: `group-${group.id}`,
      content: newMessage.trim(),
      timestamp: new Date(),
      createdAt: new Date(),
      type: "text",
      isRead: true,
    }

    try {
      await api.sendMessage(message)
      setNewMessage("")
      // Reload messages
      const groupMessages = await api.getChatMessages(`group-${group.id}`)
      setMessages(groupMessages)
    } catch (err) {
      console.error("Failed to send message:", err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleRetry = () => {
    setError(null)
    const loadGroupData = async () => {
      try {
        setLoading(true)
        const [groupData, groupPosts, groupMembers] = await Promise.all([
          api.getGroup(groupId),
          api.getPosts(groupId),
          api.getUsers(),
        ])

        if (!groupData) {
          setError("Không tìm thấy nhóm")
          return
        }

        setGroup(groupData)
        setPosts(groupPosts)
        setMembers(groupMembers.slice(0, 10))
      } catch (err) {
        setError("Không thể tải thông tin nhóm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadGroupData()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !group) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <ErrorState title="Lỗi tải nhóm" description={error || "Không tìm thấy nhóm"} onRetry={handleRetry} />
        </div>
      </AppShell>
    )
  }

  const getJoinButtonContent = () => {
    switch (group.joinStatus) {
      case "joined":
        return "Đã tham gia"
      case "pending":
        return "Chờ duyệt"
      default:
        return "Tham gia nhóm"
    }
  }

  const canViewContent = !group.isPrivate || group.joinStatus === "joined"

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Group Header */}
        <div className="space-y-6">
          {/* Cover Image */}
          {group.coverImage && (
            <div className="aspect-[3/1] w-full rounded-lg overflow-hidden">
              <img
                src={group.coverImage || "/placeholder.svg"}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Group Info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={group.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">{group.name.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">{group.name}</h1>
                  {group.isPrivate && <Badge variant="secondary">Riêng tư</Badge>}
                </div>

                <p className="text-muted-foreground max-w-2xl">{group.description}</p>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{formatNumber(group.memberCount)} thành viên</span>
                  </div>
                  <span>•</span>
                  <span>Tạo {new Date(group.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>

                {/* Tags */}
                {group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleJoinToggle}
                className={group.joinStatus === "joined" ? "" : "bg-educonnect-primary hover:bg-educonnect-primary/90"}
              >
                {getJoinButtonContent()}
              </Button>

              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt nhóm
                  </DropdownMenuItem>
                  <DropdownMenuItem>Báo cáo nhóm</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        {!canViewContent ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nhóm riêng tư</h3>
            <p className="text-muted-foreground mb-4">Bạn cần tham gia nhóm để xem nội dung</p>
            <Button onClick={handleJoinToggle} className="bg-educonnect-primary hover:bg-educonnect-primary/90">
              Yêu cầu tham gia
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="posts">Bài viết</TabsTrigger>
              <TabsTrigger value="members">Thành viên</TabsTrigger>
              <TabsTrigger value="chat">Trò chuyện</TabsTrigger>
              <TabsTrigger value="files">Tệp tin</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6 mt-6">
              {posts.length === 0 ? (
                <EmptyState
                  title="Chưa có bài viết nào"
                  description="Hãy là người đầu tiên chia sẻ trong nhóm này!"
                  action={{
                    label: "Tạo bài viết",
                    onClick: () => (window.location.href = `/compose?group=${group.id}`),
                  }}
                />
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} showGroup={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-6 mt-6">
              {members.length === 0 ? (
                <EmptyState title="Chưa có thành viên nào" description="Nhóm này chưa có thành viên." />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <UserCard key={member.id} user={member} showFollowButton={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-6 mt-6">
              <div className="border rounded-lg h-[500px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Trò chuyện nhóm</h3>
                  <p className="text-sm text-muted-foreground">{members.length} thành viên</p>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isCurrentUser = message.senderId === "current-user"
                        const sender = members.find((m) => m.id === message.senderId) || members[0]

                        return (
                          <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                              {!isCurrentUser && (
                                <Avatar className="h-6 w-6 mt-1">
                                  <AvatarImage src={sender?.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{sender?.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`px-3 py-2 rounded-lg ${
                                  isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                                }`}
                              >
                                {!isCurrentUser && <p className="text-xs font-medium mb-1">{sender?.displayName}</p>}
                                <p className="text-sm">{message.content}</p>
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
                      })
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <Button size="sm" variant="ghost">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Nhập tin nhắn..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-12"
                      />
                      <Button size="sm" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={sendMessage} disabled={!newMessage.trim()} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-6 mt-6">
              <EmptyState
                title="Chưa có tệp tin nào"
                description="Các tệp tin được chia sẻ trong nhóm sẽ xuất hiện ở đây"
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppShell>
  )
}
