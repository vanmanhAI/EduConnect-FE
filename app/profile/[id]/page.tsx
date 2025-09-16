"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Calendar, Trophy, UserPlus, UserCheck, Settings, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { GroupCard } from "@/components/features/groups/group-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { formatNumber, formatDate } from "@/lib/utils"
import type { User, Post, Group, Badge as BadgeType } from "@/types"

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("posts")
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [userData, userPosts, userGroups, userBadges] = await Promise.all([
          api.getUser(userId),
          api.getPosts(), // Mock: filter by user in real implementation
          api.getGroups(), // Mock: filter by user groups in real implementation
          api.getBadges(),
        ])

        if (!userData) {
          setError("Không tìm thấy người dùng")
          return
        }

        setUser(userData)
        setPosts(userPosts.slice(0, 5)) // Mock: user's posts
        setGroups(userGroups.slice(0, 3)) // Mock: user's groups
        setBadges(userBadges.slice(0, 4)) // Mock: user's badges
        setIsFollowing(userData.isFollowing || false)
        setFollowerCount(userData.followers)
      } catch (err) {
        setError("Không thể tải thông tin người dùng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      loadUserData()
    }
  }, [userId])

  const handleFollowToggle = async () => {
    if (!user) return

    try {
      if (isFollowing) {
        await api.unfollowUser(user.id)
        setIsFollowing(false)
        setFollowerCount((prev) => prev - 1)
      } else {
        await api.followUser(user.id)
        setIsFollowing(true)
        setFollowerCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error)
    }
  }

  const handleRetry = () => {
    setError(null)
    const loadUserData = async () => {
      try {
        setLoading(true)
        const [userData, userPosts, userGroups, userBadges] = await Promise.all([
          api.getUser(userId),
          api.getPosts(),
          api.getGroups(),
          api.getBadges(),
        ])

        if (!userData) {
          setError("Không tìm thấy người dùng")
          return
        }

        setUser(userData)
        setPosts(userPosts.slice(0, 5))
        setGroups(userGroups.slice(0, 3))
        setBadges(userBadges.slice(0, 4))
        setIsFollowing(userData.isFollowing || false)
        setFollowerCount(userData.followers)
      } catch (err) {
        setError("Không thể tải thông tin người dùng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadUserData()
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative aspect-[16/5] bg-muted rounded-lg animate-pulse" />
          <div className="bg-background border rounded-lg -mt-8 mx-4 md:mx-0 p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 md:h-24 md:w-24 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                <div className="h-3 w-28 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !user) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <ErrorState title="Lỗi tải hồ sơ" description={error || "Không tìm thấy người dùng"} onRetry={handleRetry} />
        </div>
      </AppShell>
    )
  }

  const isOwnProfile = userId === "1" // Mock: check if viewing own profile

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="space-y-0">
          {/* Cover/Background */}
          <div className="relative aspect-[16/5] bg-gradient-to-r from-educonnect-primary/20 to-educonnect-accent/20 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="bg-background border rounded-lg -mt-8 mx-4 md:mx-0 relative z-10 shadow-sm">
            <div className="p-4 md:p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 md:h-24 md:w-24 ring-2 ring-background">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.displayName} />
                    <AvatarFallback className="bg-gradient-to-br from-educonnect-primary to-educonnect-accent text-white">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold truncate">{user.displayName}</h1>
                    <p className="text-muted-foreground text-sm truncate">@{user.username}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Tham gia {formatDate(user.joinedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {isOwnProfile ? (
                    <Button variant="outline" size="sm" asChild aria-label="Chỉnh sửa hồ sơ">
                      <a href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleFollowToggle}
                      className="min-w-[110px]"
                      aria-label={isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Đang theo dõi
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Theo dõi
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="outline" size="sm" aria-label="Chia sẻ hồ sơ">
                    <Share2 className="mr-2 h-4 w-4" />
                    Chia sẻ
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="border-t pt-4">
                  <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line break-words [overflow-wrap:anywhere] line-clamp-5 md:line-clamp-none max-w-2xl">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="border-t pt-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{formatNumber(followerCount)}</span>
                    <span className="text-muted-foreground">người theo dõi</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{formatNumber(user.following)}</span>
                    <span className="text-muted-foreground">đang theo dõi</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-4 w-4 text-educonnect-primary" />
                    <span className="font-semibold text-educonnect-primary">{formatNumber(user.points)} điểm</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Level {user.level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
              <div className="inline-flex gap-2 px-1">
                <TabsTrigger value="posts">Bài viết</TabsTrigger>
                <TabsTrigger value="groups">Nhóm</TabsTrigger>
                <TabsTrigger value="badges">Huy hiệu</TabsTrigger>
                <TabsTrigger value="activity">Hoạt động</TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="posts" className="space-y-6 mt-2">
              {posts.length === 0 ? (
                <EmptyState
                  title="Chưa có bài viết nào"
                  description={
                    isOwnProfile ? "Bạn chưa đăng bài viết nào" : `${user.displayName} chưa đăng bài viết nào`
                  }
                  action={
                    isOwnProfile
                      ? {
                          label: "Tạo bài viết đầu tiên",
                          onClick: () => (window.location.href = "/compose"),
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="space-y-6 mt-2">
              {groups.length === 0 ? (
                <EmptyState
                  title="Chưa tham gia nhóm nào"
                  description={
                    isOwnProfile ? "Bạn chưa tham gia nhóm nào" : `${user.displayName} chưa tham gia nhóm nào`
                  }
                  action={
                    isOwnProfile
                      ? {
                          label: "Khám phá nhóm",
                          onClick: () => (window.location.href = "/groups"),
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges" className="space-y-6 mt-2">
              {badges.length === 0 ? (
                <EmptyState
                  title="Chưa có huy hiệu nào"
                  description={
                    isOwnProfile ? "Tham gia hoạt động để nhận huy hiệu" : `${user.displayName} chưa có huy hiệu nào`
                  }
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                  {badges.map((badge) => (
                    <Card key={badge.id} className="text-center p-4 hover:shadow-md transition-shadow">
                      <CardContent className="space-y-2">
                        <div className="text-2xl">{badge.icon}</div>
                        <h3 className="font-medium text-sm">{badge.name}</h3>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {badge.rarity}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              <EmptyState title="Hoạt động gần đây" description="Lịch sử hoạt động sẽ hiển thị ở đây" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}
