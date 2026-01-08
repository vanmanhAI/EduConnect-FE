"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Plus, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { PostSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import type { Post } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { LoginPromptDialog } from "@/components/auth/login-prompt-dialog"

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [followingPosts, setFollowingPosts] = useState<Post[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [trendingPage, setTrendingPage] = useState(1)
  const [trendingHasMore, setTrendingHasMore] = useState(false)
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false)
  const [followingPage, setFollowingPage] = useState(1)
  const [followingHasMore, setFollowingHasMore] = useState(false)
  const [followingLoadingMore, setFollowingLoadingMore] = useState(false)

  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        setError(null)

        if (activeTab === "trending") {
          const result = await api.getTrendingPosts(1, 10, 1)
          setTrendingPosts(result.posts)
          setTrendingHasMore(result.hasMore)
          setTrendingPage(1)
        } else if (activeTab === "following") {
          // Double check if user is logged in, though tab should be hidden
          if (user) {
            const result = await api.getFollowingPosts(1, 10, 1)
            setFollowingPosts(result.posts)
            setFollowingHasMore(result.hasMore)
            setFollowingPage(1)
          }
        } else if (activeTab === "all") {
          let result
          if (user) {
            result = await api.getFeedPosts(1, 10, 1)
          } else {
            // Guest user: use trending posts as "all" (public) feed
            result = await api.getTrendingPosts(1, 10, 1)
          }
          setPosts(result.posts)
          setHasMore(result.hasMore)
          setPage(1)
        }
      } catch (err) {
        console.error("Feed load error:", err)
        setError("Không thể tải bảng tin. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [activeTab, user])

  // Load trending tags

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      let result
      if (user) {
        result = await api.getFeedPosts(nextPage, 10, 1)
      } else {
        result = await api.getTrendingPosts(nextPage, 10, 1)
      }
      setPosts((prev) => [...prev, ...result.posts])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (err) {
      setError("Không thể tải thêm bài viết. Vui lòng thử lại.")
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, user])

  const handleLoadMoreTrending = useCallback(async () => {
    if (trendingLoadingMore || !trendingHasMore) return

    try {
      setTrendingLoadingMore(true)
      const nextPage = trendingPage + 1
      const result = await api.getTrendingPosts(nextPage, 10, 1)
      setTrendingPosts((prev) => [...prev, ...result.posts])
      setTrendingHasMore(result.hasMore)
      setTrendingPage(nextPage)
    } catch (err) {
      setError("Không thể tải thêm bài viết thịnh hành. Vui lòng thử lại.")
    } finally {
      setTrendingLoadingMore(false)
    }
  }, [trendingLoadingMore, trendingHasMore, trendingPage])

  const handleLoadMoreFollowing = useCallback(async () => {
    if (followingLoadingMore || !followingHasMore || !user) return

    try {
      setFollowingLoadingMore(true)
      const nextPage = followingPage + 1
      const result = await api.getFollowingPosts(nextPage, 10, 1)
      setFollowingPosts((prev) => [...prev, ...result.posts])
      setFollowingHasMore(result.hasMore)
      setFollowingPage(nextPage)
    } catch (err) {
      setError("Không thể tải thêm bài viết đang theo dõi. Vui lòng thử lại.")
    } finally {
      setFollowingLoadingMore(false)
    }
  }, [followingLoadingMore, followingHasMore, followingPage, user])

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "all" && hasMore && !loadingMore) {
            handleLoadMore()
          } else if (activeTab === "following" && followingHasMore && !followingLoadingMore) {
            handleLoadMoreFollowing()
          } else if (activeTab === "trending" && trendingHasMore && !trendingLoadingMore) {
            handleLoadMoreTrending()
          }
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [
    loading,
    activeTab,
    hasMore,
    loadingMore,
    followingHasMore,
    followingLoadingMore,
    trendingHasMore,
    trendingLoadingMore,
    handleLoadMore,
    handleLoadMoreFollowing,
    handleLoadMoreTrending,
  ])

  const handleRetry = () => {
    setError(null)
    const loadPosts = async () => {
      try {
        setLoading(true)
        if (activeTab === "trending") {
          const result = await api.getTrendingPosts(1, 10, 1)
          setTrendingPosts(result.posts)
          setTrendingHasMore(result.hasMore)
          setTrendingPage(1)
        } else if (activeTab === "following") {
          if (user) {
            const result = await api.getFollowingPosts(1, 10, 1)
            setFollowingPosts(result.posts)
            setFollowingHasMore(result.hasMore)
            setFollowingPage(1)
          }
        } else {
          let result
          if (user) {
            result = await api.getFeedPosts(1, 10, 1)
          } else {
            result = await api.getTrendingPosts(1, 10, 1)
          }
          setPosts(result.posts)
          setHasMore(result.hasMore)
          setPage(1)
        }
      } catch (err) {
        setError("Không thể tải bảng tin. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }

  const handleReloadPosts = async () => {
    try {
      if (activeTab === "all") {
        let result
        if (user) {
          result = await api.getFeedPosts(1, 10, 1)
        } else {
          result = await api.getTrendingPosts(1, 10, 1)
        }
        setPosts(result.posts)
        setHasMore(result.hasMore)
        setPage(1)
      } else if (activeTab === "trending") {
        const result = await api.getTrendingPosts(1, 10, 1)
        setTrendingPosts(result.posts)
        setTrendingHasMore(result.hasMore)
        setTrendingPage(1)
      } else if (activeTab === "following" && user) {
        const result = await api.getFollowingPosts(1, 10, 1)
        setFollowingPosts(result.posts)
        setFollowingHasMore(result.hasMore)
        setFollowingPage(1)
      }
    } catch (err) {
      console.error("Failed to reload posts:", err)
    }
  }

  const handleCreatePostClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      setShowLoginPrompt(true)
    }
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="space-y-3">
        <Button className="w-full bg-educonnect-primary hover:bg-educonnect-primary/90" asChild>
          <Link href="/compose" onClick={handleCreatePostClick}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo bài viết
          </Link>
        </Button>
        <Button variant="outline" className="w-full bg-transparent" asChild>
          <Link href="/groups">
            <TrendingUp className="mr-2 h-4 w-4" />
            Khám phá nhóm
          </Link>
        </Button>
      </div>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bảng tin</h1>
            <p className="text-muted-foreground">Khám phá những bài viết mới nhất từ cộng đồng</p>
          </div>
          <Button className="bg-educonnect-primary hover:bg-educonnect-primary/90" asChild>
            <Link href="/compose" onClick={handleCreatePostClick}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài viết
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between px-0">
            <TabsList className={`grid w-full max-w-md ${user ? "grid-cols-3" : "grid-cols-2"}`}>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              {user && <TabsTrigger value="following">Đang theo dõi</TabsTrigger>}
              <TabsTrigger value="trending">Thịnh hành</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-6 mt-6">
            {loading && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            )}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && posts.length === 0 && (
              <EmptyState
                title="Chưa có bài viết nào"
                description={
                  user
                    ? "Hãy là người đầu tiên chia sẻ kiến thức với cộng đồng!"
                    : "Chưa có bài viết nào trong bảng tin."
                }
                action={
                  user
                    ? {
                        label: "Tạo bài viết đầu tiên",
                        onClick: () => (window.location.href = "/compose"),
                      }
                    : undefined
                }
              />
            )}

            {!loading && !error && posts.length > 0 && (
              <>
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdated={handleReloadPosts}
                      onPostDeleted={handleReloadPosts}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {(hasMore || loadingMore) && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {loadingMore ? (
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

          {user && (
            <TabsContent value="following" className="space-y-6 mt-6">
              {loading && (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              )}

              {error && <ErrorState description={error} onRetry={handleRetry} />}

              {!loading && !error && followingPosts.length === 0 && (
                <EmptyState
                  title="Chưa theo dõi ai"
                  description="Theo dõi những người dùng thú vị để xem bài viết của họ ở đây"
                  action={{
                    label: "Khám phá người dùng",
                    onClick: () => (window.location.href = "/people"),
                  }}
                />
              )}

              {!loading && !error && followingPosts.length > 0 && (
                <>
                  <div className="space-y-6">
                    {followingPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onPostUpdated={handleReloadPosts}
                        onPostDeleted={handleReloadPosts}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll Trigger */}
                  {(followingHasMore || followingLoadingMore) && (
                    <div ref={loadMoreRef} className="flex justify-center py-4">
                      {followingLoadingMore ? (
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
          )}

          <TabsContent value="trending" className="space-y-6 mt-6">
            {loading && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            )}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && trendingPosts.length === 0 && (
              <EmptyState
                title="Chưa có bài viết thịnh hành"
                description="Hãy đăng bài và nhận nhiều tương tác để xuất hiện ở đây!"
                action={{
                  label: "Tạo bài viết",
                  onClick: () => (window.location.href = "/compose"),
                }}
              />
            )}

            {!loading && !error && trendingPosts.length > 0 && (
              <>
                <div className="space-y-6">
                  {trendingPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPostUpdated={handleReloadPosts}
                      onPostDeleted={handleReloadPosts}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {(trendingHasMore || trendingLoadingMore) && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {trendingLoadingMore ? (
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
        </Tabs>

        <LoginPromptDialog
          open={showLoginPrompt}
          onOpenChange={setShowLoginPrompt}
          title="Đăng nhập để tạo bài viết"
          description="Bạn cần đăng nhập để chia sẻ kiến thức và đặt câu hỏi cho cộng đồng."
        />
      </div>
    </AppShell>
  )
}
