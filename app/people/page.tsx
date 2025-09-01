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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  const popularSkills = ["javascript", "react", "design", "python", "marketing", "startup"]

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getUsers()
        setUsers(data)
        setFilteredUsers(data)
      } catch (err) {
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const debouncedSearch = debounce((query: string) => {
    if (!query.trim()) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        (user.bio && user.bio.toLowerCase().includes(query.toLowerCase()))
    )
    setFilteredUsers(filtered)
  }, 300)

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, users, debouncedSearch])

  const handleRetry = () => {
    setError(null)
    const loadUsers = async () => {
      try {
        setLoading(true)
        const data = await api.getUsers()
        setUsers(data)
        setFilteredUsers(data)
      } catch (err) {
        setError("Không thể tải danh sách người dùng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }

  const getUsersByTab = () => {
    let result = [...filteredUsers]

    switch (activeTab) {
      case "following":
        result = result.filter((user) => user.isFollowing)
        break
      case "popular":
        result = result.sort((a, b) => b.followers - a.followers)
        break
      default:
        break
    }

    // Apply sorting
    switch (sortBy) {
      case "points":
        result = result.sort((a, b) => b.points - a.points)
        break
      case "followers":
        result = result.sort((a, b) => b.followers - a.followers)
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
          <span className="font-medium">{users.filter((u) => u.isFollowing).length}</span>
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
            {loading && (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <UserSkeleton key={i} />
                ))}
              </div>
            )}

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
              <div className="grid md:grid-cols-2 gap-6">
                {getUsersByTab().map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
