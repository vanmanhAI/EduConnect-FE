"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users, Settings, Share2, MoreHorizontal, Trash2, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { UserCard } from "@/components/features/users/user-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { EditGroupDialog } from "@/components/features/groups/edit-group-dialog"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { tokenManager } from "@/lib/auth"
import { formatNumber } from "@/lib/utils"
import type { Group, Post, User } from "@/types"

export default function GroupDetailPage() {
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<User[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("posts")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [postsPage, setPostsPage] = useState(1)
  const [postsHasMore, setPostsHasMore] = useState(false)
  const [postsLoadingMore, setPostsLoadingMore] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadGroupData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load group data first
        const groupData = await api.getGroup(groupId)

        if (!groupData) {
          setError("Không tìm thấy nhóm")
          return
        }

        // Determine if current user is owner or has joined
        let joinStatus: Group["joinStatus"] = groupData.joinStatus || "not-joined"
        try {
          const currentUser = tokenManager.getUser()
          const ownerJoined = currentUser && groupData.ownerId === currentUser.id
          let hasJoined = false
          try {
            const joinedGroups = await api.getJoinedGroups()
            hasJoined = joinedGroups.groups?.some((g) => g.id === groupData.id) || false
          } catch (error) {
            // ignore errors from joined groups API; default to not joined
            console.log("Could not fetch joined groups, defaulting to not joined")
          }
          if (ownerJoined || hasJoined) joinStatus = "joined"
        } catch (error) {
          console.log("Could not determine join status, defaulting to not joined")
        }

        setGroup({ ...groupData, joinStatus })
        setMembers([]) // will be loaded when switching to Members tab

        // Load posts (non-blocking)
        try {
          const postsResult = await api.getGroupPosts(groupId, 1, 10, 1)
          setPosts(postsResult.posts)
          setPostsHasMore(postsResult.hasMore)
          setPostsPage(1)
        } catch (err) {
          console.error("Failed to load group posts:", err)
          setPosts([])
          setPostsHasMore(false)
        }
      } catch (err: any) {
        console.error("Failed to load group data:", err)
        setError(err?.message || "Không thể tải thông tin nhóm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      loadGroupData()
    }
  }, [groupId])

  // Check if current user is the group owner
  const isOwner = useMemo(() => {
    if (!group) return false
    const currentUser = tokenManager.getUser()
    return currentUser && group.ownerId === currentUser.id
  }, [group])

  const canViewMembers = useMemo(() => {
    if (!group) return false
    return isOwner || group.joinStatus === "joined"
  }, [group, isOwner])

  // Load members when Members tab is selected and allowed
  useEffect(() => {
    const loadMembers = async () => {
      if (!group || activeTab !== "members" || !canViewMembers) return
      try {
        setIsLoadingMembers(true)
        const backendMembers = await api.getGroupMembers(group.id)
        if (backendMembers && backendMembers.length > 0) {
          setMembers(backendMembers)
        } else {
          setMembers([])
        }
      } catch (e) {
        console.error("Failed to load group members:", e)
      } finally {
        setIsLoadingMembers(false)
      }
    }
    loadMembers()
  }, [group, activeTab, canViewMembers])

  // Reload members after kicking
  const handleMemberKicked = async () => {
    if (!group) return
    try {
      const backendMembers = await api.getGroupMembers(group.id)
      setMembers(backendMembers)
      // Update member count
      setGroup({ ...group, memberCount: group.memberCount - 1 })
      toast({
        title: "Đã kick thành viên",
        description: "Thành viên đã được loại khỏi nhóm",
      })
    } catch (error) {
      console.error("Failed to reload members:", error)
    }
  }

  // Handle when current user leaves the group
  const handleMemberLeft = async () => {
    toast({
      title: "Đã rời nhóm",
      description: "Bạn đã rời khỏi nhóm thành công",
    })
    // Redirect to groups page after leaving
    router.push("/groups")
  }

  const handleJoinToggle = async () => {
    if (!group) return

    const previousGroup = group

    try {
      if (group.joinStatus === "joined") {
        await api.leaveGroup(group.id)
        setGroup({ ...group, joinStatus: "not-joined", memberCount: group.memberCount - 1 })
        // Clear posts when leaving group
        setPosts([])
        toast({
          title: "Đã rời khỏi nhóm",
          description: `Bạn đã rời khỏi nhóm ${group.name}`,
        })
      } else {
        await api.joinGroup(group.id)
        const newStatus = group.isPrivate ? "pending" : "joined"
        setGroup({
          ...group,
          joinStatus: newStatus,
          memberCount: group.isPrivate ? group.memberCount : group.memberCount + 1,
        })

        // Load posts immediately after joining (only for public groups)
        if (!group.isPrivate) {
          try {
            const postsResult = await api.getGroupPosts(group.id, 1, 10, 1)
            setPosts(postsResult.posts)
            setPostsHasMore(postsResult.hasMore)
            setPostsPage(1)
          } catch (err) {
            console.error("Failed to load posts after joining:", err)
          }
        }

        toast({
          title: group.isPrivate ? "Yêu cầu đã gửi" : "Tham gia thành công",
          description: group.isPrivate
            ? `Yêu cầu tham gia nhóm ${group.name} đang chờ duyệt`
            : `Bạn đã tham gia nhóm ${group.name}`,
        })
      }
    } catch (error: any) {
      console.error("Failed to toggle group membership:", error)
      // Revert state on error
      setGroup(previousGroup)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể thực hiện thao tác. Vui lòng thử lại.",
      })
    }
  }

  const handleSaveGroupSettings = async (data: { name: string; description: string; tags: string[] }) => {
    if (!group) return

    try {
      const updatedGroup = await api.updateGroup(group.id, data)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }
    } catch (error) {
      console.error("Failed to update group:", error)
      throw error
    }
  }

  const handleDeleteGroup = async () => {
    if (!group) return

    setIsDeleting(true)
    try {
      await api.deleteGroup(group.id)
      // Redirect to groups page after successful deletion
      router.push("/groups")
    } catch (error: any) {
      console.error("Failed to delete group:", error)
      setError(error.message || "Không thể xóa nhóm. Vui lòng thử lại.")
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLoadMorePosts = useCallback(async () => {
    if (postsLoadingMore || !postsHasMore || !group) return

    try {
      setPostsLoadingMore(true)
      const nextPage = postsPage + 1
      const result = await api.getGroupPosts(group.id, nextPage, 10, 1)
      setPosts((prev) => [...prev, ...result.posts])
      setPostsHasMore(result.hasMore)
      setPostsPage(nextPage)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thêm bài viết. Vui lòng thử lại.",
      })
    } finally {
      setPostsLoadingMore(false)
    }
  }, [postsLoadingMore, postsHasMore, group, postsPage, toast])

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "posts" && postsHasMore && !postsLoadingMore) {
            handleLoadMorePosts()
          }
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loading, activeTab, postsHasMore, postsLoadingMore, handleLoadMorePosts])

  const handleReloadPosts = async () => {
    if (!group) return
    try {
      const result = await api.getGroupPosts(group.id, 1, 10, 1)
      setPosts(result.posts)
      setPostsHasMore(result.hasMore)
      setPostsPage(1)
    } catch (err) {
      console.error("Failed to reload posts:", err)
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
  const canViewPosts = group.joinStatus === "joined" // Only members can view posts

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Group Header */}
        <div className="space-y-6">
          {/* Cover Image - Always display with placeholder if no image */}
          <div className="aspect-[3/1] w-full rounded-lg overflow-hidden bg-gradient-to-r from-educonnect-primary/10 to-educonnect-primary/5">
            <img src={group.coverImage || "/placeholder.svg"} alt={group.name} className="w-full h-full object-cover" />
          </div>

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
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => {
                      const tagName = typeof tag === "string" ? tag : tag.name
                      const tagId = typeof tag === "string" ? tag : tag.id
                      return (
                        <Badge key={tagId} variant="secondary" className="text-xs">
                          {tagName.startsWith("#") ? tagName : `#${tagName}`}
                        </Badge>
                      )
                    })}
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

              {group.joinStatus === "joined" && (
                <Button variant="outline" onClick={() => router.push(`/chat?groupId=${group.id}`)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Nhắn tin
                </Button>
              )}

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
                  {isOwner && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt nhóm
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa nhóm
                      </DropdownMenuItem>
                    </>
                  )}
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
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="posts">Bài viết</TabsTrigger>
              <TabsTrigger value="members">Thành viên</TabsTrigger>
              <TabsTrigger value="files">Tệp tin</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6 mt-6">
              {!canViewPosts ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Bạn không phải thành viên của nhóm. Vui lòng tham gia nhóm để có thể xem bài viết
                  </p>
                  <Button onClick={handleJoinToggle} className="bg-educonnect-primary hover:bg-educonnect-primary/90">
                    {getJoinButtonContent()}
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <EmptyState
                  title="Chưa có bài viết nào"
                  description="Hãy là người đầu tiên chia sẻ trong nhóm này!"
                  action={{
                    label: "Tạo bài viết",
                    onClick: () => (window.location.href = `/compose?group=${group.id}`),
                  }}
                />
              ) : (
                <>
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        showGroup={false}
                        onPostUpdated={handleReloadPosts}
                        onPostDeleted={handleReloadPosts}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll Trigger */}
                  {(postsHasMore || postsLoadingMore) && (
                    <div ref={loadMoreRef} className="flex justify-center py-4">
                      {postsLoadingMore ? (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang tải thêm...</span>
                        </div>
                      ) : (
                        <div className="h-4" /> /* Invisible trigger target */
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-6 mt-6">
              {!canViewMembers ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Vui lòng tham gia nhóm để xem danh sách thành viên.</p>
                </div>
              ) : isLoadingMembers ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <EmptyState title="Chưa có thành viên nào" description="Nhóm này chưa có thành viên." />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <UserCard
                      key={member.id}
                      user={member}
                      showFollowButton={false}
                      isGroupOwner={isOwner}
                      groupId={group?.id}
                      onMemberKicked={handleMemberKicked}
                      onMemberLeft={handleMemberLeft}
                    />
                  ))}
                </div>
              )}
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

      {/* Edit Group Dialog - Only for group owner */}
      {group && isOwner && (
        <EditGroupDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          group={group}
          onSave={handleSaveGroupSettings}
        />
      )}

      {/* Delete Confirmation Dialog - Only for group owner */}
      {group && isOwner && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn muốn xóa nhóm này?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác. Nhóm <strong>{group.name}</strong> và tất cả dữ liệu liên quan sẽ bị
                xóa vĩnh viễn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Đang xóa..." : "Xóa nhóm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppShell>
  )
}
