"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { GroupCard } from "@/components/features/groups/group-card"
import { GroupSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { debounce } from "@/lib/utils"
import type { Group } from "@/types"

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const popularCategories = [
    "javascript",
    "react",
    "design",
    "python",
    "machine-learning",
    "startup",
    "career",
    "freelance",
  ]

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getGroups()
        setGroups(data)
        setFilteredGroups(data)
      } catch (err) {
        setError("Không thể tải danh sách nhóm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  const debouncedSearch = debounce((query: string) => {
    if (!query.trim()) {
      setFilteredGroups(groups)
      return
    }

    const filtered = groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query.toLowerCase()) ||
        group.description.toLowerCase().includes(query.toLowerCase()) ||
        group.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    )
    setFilteredGroups(filtered)
  }, 300)

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, groups, debouncedSearch])

  const handleRetry = () => {
    setError(null)
    const loadGroups = async () => {
      try {
        setLoading(true)
        const data = await api.getGroups()
        setGroups(data)
        setFilteredGroups(data)
      } catch (err) {
        setError("Không thể tải danh sách nhóm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadGroups()
  }

  const getGroupsByTab = () => {
    switch (activeTab) {
      case "joined":
        return filteredGroups.filter((group) => group.joinStatus === "joined")
      case "popular":
        return [...filteredGroups].sort((a, b) => b.memberCount - a.memberCount)
      default:
        return filteredGroups
    }
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Danh mục phổ biến</h3>
        <div className="flex flex-wrap gap-2">
          {popularCategories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="cursor-pointer hover:bg-educonnect-primary hover:text-white transition-colors"
              onClick={() => setSearchQuery(category)}
            >
              #{category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>Tổng số nhóm:</span>
          <span className="font-medium">{groups.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Đã tham gia:</span>
          <span className="font-medium">{groups.filter((g) => g.joinStatus === "joined").length}</span>
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
            <h1 className="text-2xl font-bold">Khám phá nhóm</h1>
            <p className="text-muted-foreground">Tham gia các cộng đồng học tập và chia sẻ kiến thức</p>
          </div>
          <Button className="bg-educonnect-primary hover:bg-educonnect-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Tạo nhóm
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm nhóm theo tên, mô tả hoặc thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="joined">Đã tham gia</TabsTrigger>
            <TabsTrigger value="popular">Phổ biến</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading && (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <GroupSkeleton key={i} />
                ))}
              </div>
            )}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && getGroupsByTab().length === 0 && (
              <EmptyState
                title={
                  activeTab === "joined"
                    ? "Chưa tham gia nhóm nào"
                    : searchQuery
                      ? "Không tìm thấy nhóm"
                      : "Chưa có nhóm nào"
                }
                description={
                  activeTab === "joined"
                    ? "Tham gia các nhóm để kết nối với cộng đồng"
                    : searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Hãy tạo nhóm đầu tiên cho cộng đồng"
                }
                action={{
                  label: activeTab === "joined" ? "Khám phá nhóm" : "Tạo nhóm mới",
                  onClick: () => {
                    if (activeTab === "joined") {
                      setActiveTab("all")
                    } else {
                      // Navigate to create group
                    }
                  },
                }}
              />
            )}

            {!loading && !error && getGroupsByTab().length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
                {getGroupsByTab().map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
