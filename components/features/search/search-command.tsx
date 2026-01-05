"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { api } from "@/lib/api"
import type { Post } from "@/types"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Search posts with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!query.trim()) {
      setPosts([])
      setPage(1)
      setHasMore(false)
      return
    }

    setLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const result = await api.searchPosts(query, 1, 10, 1)
        setPosts(result.posts || [])
        setHasMore(result.hasMore)
        setPage(1)
      } catch (error) {
        console.error("Search error:", error)
        setPosts([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("")
      setPosts([])
      setPage(1)
      setHasMore(false)
    }
  }, [open])

  // Load more posts (infinite scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !query.trim()) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await api.searchPosts(query, nextPage, 10, 1)
      setPosts((prev) => [...prev, ...(result.posts || [])])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (error) {
      console.error("Load more error:", error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, query, page])

  // Handle scroll for infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
      if (scrollBottom < 50 && hasMore && !loadingMore) {
        loadMore()
      }
    },
    [hasMore, loadingMore, loadMore]
  )

  const handleSelect = (postId: string) => {
    onOpenChange(false)
    router.push(`/posts/${postId}`)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tìm kiếm bài viết..." value={query} onValueChange={setQuery} />
      <CommandList ref={listRef as any} onScroll={handleScroll} className="max-h-[400px]">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && posts.length === 0 && query && <CommandEmpty>Không tìm thấy bài viết cho "{query}"</CommandEmpty>}

        {!loading && !query && <CommandEmpty>Nhập từ khóa để tìm kiếm bài viết...</CommandEmpty>}

        {!loading && posts.length > 0 && (
          <CommandGroup heading={`Bài viết (${posts.length}${hasMore ? "+" : ""})`}>
            {posts.map((post) => (
              <CommandItem
                key={post.id}
                value={`post-${post.id}-${post.title}`}
                onSelect={() => handleSelect(post.id)}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{post.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {post.author?.displayName || "Unknown"}
                    {post.group && ` • ${post.group.name}`}
                  </p>
                </div>
              </CommandItem>
            ))}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                <span className="text-xs text-muted-foreground">Đang tải thêm...</span>
              </div>
            )}

            {/* Load more button as fallback */}
            {hasMore && !loadingMore && (
              <div
                className="flex items-center justify-center py-2 cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground"
                onClick={loadMore}
              >
                Tải thêm kết quả...
              </div>
            )}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
