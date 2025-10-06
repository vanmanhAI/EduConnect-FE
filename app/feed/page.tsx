"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Filter, TrendingUp, Search, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { PostSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { AdvancedSearchDialog } from "@/components/features/search/advanced-search-dialog"
import { SearchResults } from "@/components/features/search/search-results"
import { SearchAnalytics } from "@/components/features/search/search-analytics"
import { TrendingSearches } from "@/components/features/search/trending-searches"
import { api } from "@/lib/api"
import { debounce } from "@/lib/utils"
import type { Post } from "@/types"

interface SearchFilters {
  query: string
  type: "all" | "posts" | "groups" | "users"
  sortBy: "relevance" | "date" | "popularity" | "trending"
  dateRange: {
    from?: Date
    to?: Date
  }
  tags: string[]
  authors: string[]
  groups: string[]
  minLikes?: number
  hasAttachments: boolean
  isFollowing: boolean
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    type: "all",
    sortBy: "relevance",
    dateRange: {},
    tags: [],
    authors: [],
    groups: [],
    hasAttachments: false,
    isFollowing: false,
  })

  const popularTags = ["javascript", "react", "typescript", "nextjs", "tailwind", "nodejs", "python", "design"]

  // Debounced search function
  const debouncedSearch = debounce(async (query: string) => {
    if (query.trim()) {
      setSearchFilters((prev) => ({ ...prev, query }))
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }, 300)

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getPosts()
        setPosts(data)
      } catch (err) {
        setError("Không thể tải bảng tin. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    if (!showSearchResults) {
      loadPosts()
    }
  }, [activeTab, showSearchResults])

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setSearchFilters(filters)
    setSearchQuery(filters.query)
    setShowSearchResults(true)
    setShowAdvancedSearch(false)
  }

  const handleTrendingSearch = (query: string) => {
    setSearchFilters((prev) => ({ ...prev, query }))
    setSearchQuery(query)
    setShowSearchResults(true)
  }

  const handleRetry = () => {
    setError(null)
    const loadPosts = async () => {
      try {
        setLoading(true)
        const data = await api.getPosts()
        setPosts(data)
      } catch (err) {
        setError("Không thể tải bảng tin. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="space-y-3">
        <Button className="w-full bg-educonnect-primary hover:bg-educonnect-primary/90" asChild>
          <Link href="/compose">
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
        <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowAnalytics(!showAnalytics)}>
          <BarChart3 className="mr-2 h-4 w-4" />
          {showAnalytics ? "Ẩn phân tích" : "Phân tích tìm kiếm"}
        </Button>
      </div>

      {/* Popular Tags */}
      <div>
        <h3 className="font-semibold mb-3">Thẻ phổ biến</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-educonnect-primary hover:text-white transition-colors"
              onClick={() => {
                setSearchFilters((prev) => ({
                  ...prev,
                  query: tag,
                  tags: [...prev.tags.filter((t) => t !== tag), tag],
                }))
                setSearchQuery(tag)
                setShowSearchResults(true)
              }}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Trending Searches */}
      <TrendingSearches onSearch={handleTrendingSearch} />
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
            <Link href="/compose">
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài viết
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài viết, nhóm, người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setShowAdvancedSearch(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {/* Analytics */}
        {showAnalytics && <SearchAnalytics className="mb-6" />}

        {/* Search Results or Feed */}
        {showSearchResults ? (
          <SearchResults filters={searchFilters} onFiltersChange={setSearchFilters} />
        ) : (
          <>
            {/* Filters */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between px-0">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
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
                    description="Hãy là người đầu tiên chia sẻ kiến thức với cộng đồng!"
                    action={{
                      label: "Tạo bài viết đầu tiên",
                      onClick: () => (window.location.href = "/compose"),
                    }}
                  />
                )}

                {!loading && !error && posts.length > 0 && (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="following" className="space-y-6 mt-6">
                <EmptyState
                  title="Chưa theo dõi ai"
                  description="Theo dõi những người dùng thú vị để xem bài viết của họ ở đây"
                  action={{
                    label: "Khám phá người dùng",
                    onClick: () => (window.location.href = "/people"),
                  }}
                />
              </TabsContent>

              <TabsContent value="trending" className="space-y-6 mt-6">
                {!loading && !error && posts.length > 0 && (
                  <div className="space-y-6">
                    {posts.slice(0, 5).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Advanced Search Dialog */}
        <AdvancedSearchDialog
          open={showAdvancedSearch}
          onOpenChange={setShowAdvancedSearch}
          onSearch={handleAdvancedSearch}
          initialQuery={searchQuery}
        />
      </div>
    </AppShell>
  )
}
