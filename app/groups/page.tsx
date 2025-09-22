"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

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

  const filterOptions = [
    { value: "all", label: "Tất cả nhóm" },
    { value: "public", label: "Nhóm công khai" },
    { value: "private", label: "Nhóm riêng tư" },
    { value: "low-members", label: "Ít thành viên (< 50)" },
    { value: "high-members", label: "Nhiều thành viên (≥ 50)" },
    { value: "recent", label: "Mới tạo" },
    { value: "popular", label: "Phổ biến" },
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

  const applyFiltersAndSearch = debounce((query: string, filter: string) => {
    let filtered = [...groups]

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(query.toLowerCase()) ||
          group.description.toLowerCase().includes(query.toLowerCase()) ||
          group.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      )
    }

    // Apply additional filters
    switch (filter) {
      case "public":
        filtered = filtered.filter((group) => !group.isPrivate)
        break
      case "private":
        filtered = filtered.filter((group) => group.isPrivate)
        break
      case "low-members":
        filtered = filtered.filter((group) => group.memberCount < 50)
        break
      case "high-members":
        filtered = filtered.filter((group) => group.memberCount >= 50)
        break
      case "recent":
        filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "popular":
        filtered = filtered.sort((a, b) => b.memberCount - a.memberCount)
        break
      case "all":
      default:
        // No additional filtering
        break
    }

    setFilteredGroups(filtered)
  }, 300)

  useEffect(() => {
    applyFiltersAndSearch(searchQuery, selectedFilter)
  }, [searchQuery, selectedFilter, groups, applyFiltersAndSearch])

  // Handle scroll for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
        // If popular filter is not already applied, sort by member count
        if (selectedFilter !== "popular") {
          return [...filteredGroups].sort((a, b) => b.memberCount - a.memberCount)
        }
        return filteredGroups
      default:
        return filteredGroups
    }
  }

  const handleClearFilter = () => {
    setSelectedFilter("all")
    setSearchQuery("")
  }

  const getActiveFilterLabel = () => {
    const filter = filterOptions.find((f) => f.value === selectedFilter)
    return filter ? filter.label : "Tất cả nhóm"
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

        {/* Search and Filters - Sticky */}
        <div
          className={`sticky top-16 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b transition-all duration-200 -mx-4 px-4 py-4 ${
            isScrolled ? "border-border shadow-sm" : "border-transparent"
          }`}
        >
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
            <div className="flex gap-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Bộ lọc" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(selectedFilter !== "all" || searchQuery.trim()) && (
                <Button variant="outline" size="sm" onClick={handleClearFilter} className="px-3" title="Xóa bộ lọc">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Indicator */}
          {(selectedFilter !== "all" || searchQuery.trim()) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Đang lọc:</span>
              {searchQuery.trim() && (
                <Badge variant="secondary" className="gap-1">
                  Tìm kiếm: "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              {selectedFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {getActiveFilterLabel()}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-foreground"
                    onClick={() => setSelectedFilter("all")}
                  />
                </Badge>
              )}
            </div>
          )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
