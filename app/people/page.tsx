"use client"

import { useState, useEffect } from "react"
import { Search, Filter, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppShell } from "@/components/layout/app-shell"
import { UserCard } from "@/components/features/users/user-card"
import { UserSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { debounce } from "@/lib/utils"
import type { User } from "@/types"

export default function PeoplePage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [followingUsers, setFollowingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const popularSkills = ["javascript", "react", "design", "python", "marketing", "startup"]

  useEffect(() => {
    // Only load initial users if no search query
    if (!searchQuery.trim()) {
      const loadUsers = async () => {
        try {
          setLoading(true)
          setError(null)
          const data = await api.getUsers()
          setUsers(data)
          // For initial load without pagination support in getUsers, we assume no more
          // However, better to rely on search for pagination
        } catch (err) {
          setError("Không thể tải danh sách người dùng. Vui lòng thử lại.")
        } finally {
          setLoading(false)
        }
      }
      loadUsers()
    }
  }, [])

  // Load following users when switching to "following" tab
  useEffect(() => {
    if (activeTab === "following") {
      const loadFollowingUsers = async () => {
        try {
          setLoading(true)
          setError(null)
          // Get current user from API
          const currentUser = await api.getCurrentUser()
          if (currentUser && currentUser.id) {
            const following = await api.getFollowing(currentUser.id)
            setFollowingUsers(following)
          }
        } catch (err) {
          console.error("Error loading following users:", err)
          setError("Không thể tải danh sách người đang theo dõi. Vui lòng thử lại.")
        } finally {
          setLoading(false)
        }
      }

      loadFollowingUsers()
    }
  }, [activeTab])

  const debouncedSearch = debounce(async (query: string) => {
    try {
      setLoading(true)
      setPage(1)

      if (!query.trim()) {
        const data = await api.getUsers()
        setUsers(data)
        setFilteredUsers(data)
        setHasMore(false)
        return
      }

      const res = await api.searchUsers(query, 1, 10)
      setFilteredUsers(res.users)
      setHasMore(res.hasMore)
    } catch (err) {
      console.error("Search error:", err)
      setError("Tìm kiếm thất bại. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }, 300)

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery])

  const handleRetry = () => {
    setError(null)
    const loadUsers = async () => {
      try {
        setLoading(true)
        if (activeTab === "following") {
          // Reload following users
          const currentUser = await api.getCurrentUser()
          if (currentUser && currentUser.id) {
            const following = await api.getFollowing(currentUser.id)
            setFollowingUsers(following)
          }
        } else {
          // Reload all users
          const data = await api.getUsers()
          setUsers(data)
          setFilteredUsers(data)
        }
      } catch (err) {
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    // If searching, retry search
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      loadUsers()
    }
  }

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const res = await api.searchUsers(searchQuery, nextPage, 10)

      setFilteredUsers((prev) => [...prev, ...res.users])
      setHasMore(res.hasMore)
      setPage(nextPage)
    } catch (err) {
      console.error("Load more error:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading || loadingMore || !searchQuery.trim()) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    const trigger = document.getElementById("search-load-more")
    if (trigger) observer.observe(trigger)

    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, searchQuery, page])

  const getUsersByTab = () => {
    let result = [...filteredUsers]

    switch (activeTab) {
      case "following":
        // Use the real following users from API
        result = [...followingUsers]
        // Apply search filter if there's a search query
        if (searchQuery.trim()) {
          result = result.filter(
            (user) =>
              user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        }
        break
      case "popular":
        result = result.sort((a, b) => (b.followers || 0) - (a.followers || 0))
        break
      default:
        break
    }

    // Apply sorting
    switch (sortBy) {
      case "points":
        result = result.sort((a, b) => (b.points || 0) - (a.points || 0))
        break
      case "followers":
        result = result.sort((a, b) => (b.followers || 0) - (a.followers || 0))
        break
      case "recent":
      default:
        result = result.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
        break
    }

    return result
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold mb-3">Thống kê</h3>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tổng thành viên:</span>
          <span className="font-medium">{users.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Đang theo dõi:</span>
          <span className="font-medium">{followingUsers.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Hoạt động hôm nay:</span>
          <span className="font-medium">{Math.floor(users.length * 0.3)}</span>
        </div>
      </div>

      {/* Popular Skills */}
      <div>
        <h3 className="font-semibold mb-3">Kỹ năng phổ biến</h3>
        <div className="flex flex-wrap gap-2">
          {popularSkills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="cursor-pointer hover:bg-educonnect-primary hover:text-white transition-colors"
              onClick={() => setSearchQuery(skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mọi người</h1>
            <p className="text-muted-foreground">Kết nối với cộng đồng học tập và chuyên gia</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-educonnect-primary" />
            <span className="text-sm font-medium">{users.length} thành viên</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên, username hoặc kỹ năng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mới tham gia</SelectItem>
              <SelectItem value="points">Điểm cao nhất</SelectItem>
              <SelectItem value="followers">Nhiều người theo dõi</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="following">Đang theo dõi</TabsTrigger>
            <TabsTrigger value="popular">Phổ biến</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <UserSkeleton key={i} />
                ))}
              </div>
            ) : null}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && getUsersByTab().length === 0 && (
              <EmptyState
                title={
                  activeTab === "following"
                    ? "Chưa theo dõi ai"
                    : searchQuery
                      ? "Không tìm thấy người dùng"
                      : "Chưa có thành viên nào"
                }
                description={
                  activeTab === "following"
                    ? "Theo dõi những người dùng thú vị để xem họ ở đây"
                    : searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Hãy mời bạn bè tham gia cộng đồng"
                }
                action={
                  activeTab === "following"
                    ? {
                        label: "Khám phá người dùng",
                        onClick: () => setActiveTab("all"),
                      }
                    : undefined
                }
              />
            )}

            {!loading && !error && getUsersByTab().length > 0 && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {getUsersByTab().map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>

                {/* Infinite scroll trigger for search results */}
                {searchQuery.trim() && hasMore && (
                  <div id="search-load-more" className="py-8 flex justify-center">
                    {loadingMore ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
