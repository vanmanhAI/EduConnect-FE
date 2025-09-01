"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Filter, TrendingUp } from "lucide-react"
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

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const popularTags = ["javascript", "react", "typescript", "nextjs", "tailwind", "nodejs", "python", "design"]

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

    loadPosts()
  }, [activeTab])

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
            >
              #{tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="max-w-2xl mx-auto space-y-6">
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

        {/* Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
              <TabsTrigger value="trending">Thịnh hành</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Bộ lọc
            </Button>
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
      </div>
    </AppShell>
  )
}
