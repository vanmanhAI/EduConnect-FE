"use client"

import { useState, useEffect } from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { PostSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import type { Post } from "@/types"

interface BookmarkItem {
  id: string
  createdAt: string
  post: {
    id: string
    title: string
    slug: string
    excerpt: string
    author: {
      id: string
      username: string
      displayName: string
      avatar: string | null
    }
  }
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await api.getBookmarkedPosts(1, 10)
        setBookmarks(result.items)
        setHasMore(result.hasMore)
        setPage(1)

        // Convert bookmarks to posts format
        const postsData: Post[] = result.items.map((bookmark) => ({
          id: bookmark.post.id,
          title: bookmark.post.title,
          content: bookmark.post.excerpt,
          authorId: bookmark.post.author.id,
          author: {
            id: bookmark.post.author.id,
            username: bookmark.post.author.username,
            displayName: bookmark.post.author.displayName,
            email: "",
            avatar: bookmark.post.author.avatar,
            bio: "",
            points: 0,
            level: 1,
            badges: [],
            followers: 0,
            following: 0,
            joinedAt: new Date(),
          },
          tags: [],
          attachments: [],
          reactions: [],
          commentCount: 0,
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.createdAt),
          likeCount: 0,
          isBookmarked: true,
        }))
        setPosts(postsData)
      } catch (err: any) {
        console.error("Failed to load bookmarks:", err)
        setError(err.message || "Không thể tải danh sách bài viết đã lưu. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadBookmarks()
  }, [])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const result = await api.getBookmarkedPosts(nextPage, 10)
      setBookmarks((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setPage(nextPage)

      // Convert new bookmarks to posts format and append
      const newPosts: Post[] = result.items.map((bookmark) => ({
        id: bookmark.post.id,
        title: bookmark.post.title,
        content: bookmark.post.excerpt,
        authorId: bookmark.post.author.id,
        author: {
          id: bookmark.post.author.id,
          username: bookmark.post.author.username,
          displayName: bookmark.post.author.displayName,
          email: "",
          avatar: bookmark.post.author.avatar,
          bio: "",
          points: 0,
          level: 1,
          badges: [],
          followers: 0,
          following: 0,
          joinedAt: new Date(),
        },
        tags: [],
        attachments: [],
        reactions: [],
        commentCount: 0,
        createdAt: new Date(bookmark.createdAt),
        updatedAt: new Date(bookmark.createdAt),
        likeCount: 0,
        isBookmarked: true,
      }))
      setPosts((prev) => [...prev, ...newPosts])
    } catch (err: any) {
      console.error("Failed to load more bookmarks:", err)
      setError(err.message || "Không thể tải thêm bài viết. Vui lòng thử lại.")
    } finally {
      setLoadingMore(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    const loadBookmarks = async () => {
      try {
        setLoading(true)
        const result = await api.getBookmarkedPosts(1, 10)
        setBookmarks(result.items)
        setHasMore(result.hasMore)
        setPage(1)

        const postsData: Post[] = result.items.map((bookmark) => ({
          id: bookmark.post.id,
          title: bookmark.post.title,
          content: bookmark.post.excerpt,
          authorId: bookmark.post.author.id,
          author: {
            id: bookmark.post.author.id,
            username: bookmark.post.author.username,
            displayName: bookmark.post.author.displayName,
            email: "",
            avatar: bookmark.post.author.avatar,
            bio: "",
            points: 0,
            level: 1,
            badges: [],
            followers: 0,
            following: 0,
            joinedAt: new Date(),
          },
          tags: [],
          attachments: [],
          reactions: [],
          commentCount: 0,
          createdAt: new Date(bookmark.createdAt),
          updatedAt: new Date(bookmark.createdAt),
          likeCount: 0,
          isBookmarked: true,
        }))
        setPosts(postsData)
      } catch (err: any) {
        console.error("Failed to load bookmarks:", err)
        setError(err.message || "Không thể tải danh sách bài viết đã lưu. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadBookmarks()
  }

  const handlePostUpdated = async () => {
    // Reload bookmarks to get updated data
    try {
      const result = await api.getBookmarkedPosts(1, 10)
      setBookmarks(result.items)
      setHasMore(result.hasMore)
      setPage(1)

      const postsData: Post[] = result.items.map((bookmark) => ({
        id: bookmark.post.id,
        title: bookmark.post.title,
        content: bookmark.post.excerpt,
        authorId: bookmark.post.author.id,
        author: {
          id: bookmark.post.author.id,
          username: bookmark.post.author.username,
          displayName: bookmark.post.author.displayName,
          email: "",
          avatar: bookmark.post.author.avatar,
          bio: "",
          points: 0,
          level: 1,
          badges: [],
          followers: 0,
          following: 0,
          joinedAt: new Date(),
        },
        tags: [],
        attachments: [],
        reactions: [],
        commentCount: 0,
        createdAt: new Date(bookmark.createdAt),
        updatedAt: new Date(bookmark.createdAt),
        likeCount: 0,
        isBookmarked: true,
      }))
      setPosts(postsData)
    } catch (err) {
      console.error("Failed to reload bookmarks:", err)
    }
  }

  const handlePostDeleted = (deletedPostId: string) => {
    // Remove deleted post from the list
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.post.id !== deletedPostId))
    setPosts((prev) => prev.filter((post) => post.id !== deletedPostId))
  }

  const handlePostUnbookmarked = (postId: string) => {
    // Remove unbookmarked post from the list
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.post.id !== postId))
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Stats */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">Thống kê</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tổng bài viết đã lưu</span>
            <span className="font-medium">{bookmarks.length}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">Về bài viết đã lưu</h3>
        <p className="text-sm text-muted-foreground">
          Đây là nơi lưu trữ tất cả các bài viết bạn đã đánh dấu để đọc sau. Bạn có thể bỏ lưu bài viết bất kỳ lúc nào.
        </p>
      </div>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-educonnect-primary" />
              Bài viết đã lưu
            </h1>
            <p className="text-muted-foreground mt-1">Các bài viết bạn đã đánh dấu</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={handleRetry} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="h-12 w-12" />}
            title="Chưa có bài viết đã lưu"
            description="Bạn chưa lưu bài viết nào. Hãy lưu các bài viết thú vị để đọc sau!"
          />
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  showGroup={true}
                  compact={false}
                  hideActions={true}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={() => handlePostDeleted(post.id)}
                  onPostUnbookmarked={handlePostUnbookmarked}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="min-w-[200px]">
                  {loadingMore ? "Đang tải..." : "Xem thêm"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
