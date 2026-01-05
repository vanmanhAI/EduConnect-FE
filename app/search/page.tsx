"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { PostSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { api } from "@/lib/api"
import type { Post } from "@/types"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [searchInput, setSearchInput] = useState(initialQuery)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Search function
  const searchPosts = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) {
      setPosts([])
      setHasMore(false)
      return
    }

    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const result = await api.searchPosts(searchQuery, pageNum, 10, 1)

      if (pageNum === 1) {
        setPosts(result.posts || [])
      } else {
        setPosts((prev) => [...prev, ...(result.posts || [])])
      }
      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Initial search on mount
  useEffect(() => {
    if (initialQuery) {
      searchPosts(initialQuery, 1)
    }
  }, [initialQuery, searchPosts])

  // Update URL when query changes
  useEffect(() => {
    if (query && query !== initialQuery) {
      const url = new URL(window.location.href)
      url.searchParams.set("q", query)
      window.history.replaceState({}, "", url.toString())
    }
  }, [query, initialQuery])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          searchPosts(query, page + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loading, query, page, searchPosts])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setQuery(searchInput.trim())
      setPosts([])
      setPage(1)
      searchPosts(searchInput.trim(), 1)
    }
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>Tìm kiếm bài viết theo từ khóa</p>
        <p className="mt-2">Kết quả sẽ hiển thị các bài viết có chứa từ khóa trong tiêu đề hoặc nội dung.</p>
      </div>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Tìm kiếm bài viết</h1>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nhập từ khóa tìm kiếm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm kiếm"}
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {query && (
          <div className="text-sm text-muted-foreground">
            {loading ? (
              "Đang tìm kiếm..."
            ) : (
              <>
                Kết quả tìm kiếm cho "<span className="font-medium text-foreground">{query}</span>" ({posts.length}
                {hasMore ? "+" : ""} bài viết)
              </>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && query && posts.length === 0 && (
          <EmptyState
            title="Không tìm thấy bài viết"
            description={`Không có bài viết nào phù hợp với từ khóa "${query}". Hãy thử tìm kiếm với từ khóa khác.`}
          />
        )}

        {/* Initial State */}
        {!loading && !query && (
          <EmptyState title="Tìm kiếm bài viết" description="Nhập từ khóa để tìm kiếm bài viết trong cộng đồng." />
        )}

        {/* Posts List */}
        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showGroup compact />
            ))}

            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="h-10">
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Đang tải thêm...</span>
                </div>
              )}
            </div>

            {!hasMore && posts.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Đã hiển thị tất cả kết quả</p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
