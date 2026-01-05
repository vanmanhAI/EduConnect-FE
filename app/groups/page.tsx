"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, Plus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
// Popover removed for search suggestions to avoid focus issues
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { useToast } from "@/hooks/use-toast"
import { GroupCard } from "@/components/features/groups/group-card"
import { GroupSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { debounce } from "@/lib/utils"
import type { Group } from "@/types"

export default function GroupsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([])
  const [joinedGroupsLoading, setJoinedGroupsLoading] = useState(false)
  const [trendingGroups, setTrendingGroups] = useState<Group[]>([])
  const [trendingGroupsLoading, setTrendingGroupsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string>("all")
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(10)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [joinedPage, setJoinedPage] = useState<number>(1)
  const [joinedHasMore, setJoinedHasMore] = useState<boolean>(false)
  const [joinedLoadingMore, setJoinedLoadingMore] = useState(false)
  const [trendingPage, setTrendingPage] = useState<number>(1)
  const [trendingHasMore, setTrendingHasMore] = useState<boolean>(false)
  const [trendingLoadingMore, setTrendingLoadingMore] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const searchingSeqRef = useRef(0)
  const debouncedSearchRef = useRef<((q: string, f: string, p: number) => void) | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

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
    { value: "popular", label: "Phổ biến" },
    { value: "recent", label: "Mới tạo" },
    { value: "public", label: "Nhóm công khai" },
    { value: "private", label: "Nhóm riêng tư" },
  ]

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await api.getGroups(1, pageSize)
        setGroups(result.groups)
        setFilteredGroups(result.groups)
        setHasMore(result.hasMore)
        setPage(1)
      } catch (err) {
        setError("Không thể tải danh sách nhóm. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  // Load joined groups when tab changes to "joined"
  useEffect(() => {
    if (activeTab === "joined" && joinedGroups.length === 0) {
      const loadJoinedGroups = async () => {
        try {
          setJoinedGroupsLoading(true)
          setError(null)
          const result = await api.getJoinedGroups(1, pageSize)
          setJoinedGroups(result.groups)
          setJoinedHasMore(result.hasMore)
          setJoinedPage(1)
        } catch (err) {
          // For joined groups tab, if API fails, treat as no joined groups instead of error
          if (activeTab === "joined") {
            setJoinedGroups([])
          } else {
            setError("Không thể tải danh sách nhóm đã tham gia. Vui lòng thử lại.")
          }
        } finally {
          setJoinedGroupsLoading(false)
        }
      }

      loadJoinedGroups()
    }
  }, [activeTab, joinedGroups.length, pageSize])

  // Load trending groups when tab changes to "trending"
  useEffect(() => {
    if (activeTab === "trending" && trendingGroups.length === 0) {
      const loadTrendingGroups = async () => {
        try {
          setTrendingGroupsLoading(true)
          setError(null)
          const result = await api.getTrendingGroups(1, 18, 0.05)
          setTrendingGroups(result.groups)
          setTrendingHasMore(result.hasMore)
          setTrendingPage(1)
        } catch (err) {
          // For trending groups tab, if API fails, treat as no trending groups instead of error
          if (activeTab === "trending") {
            setTrendingGroups([])
          } else {
            setError("Không thể tải danh sách nhóm phổ biến. Vui lòng thử lại.")
          }
        } finally {
          setTrendingGroupsLoading(false)
        }
      }

      loadTrendingGroups()
    }
  }, [activeTab, trendingGroups.length])

  // Hydrate state from URL on first render
  useEffect(() => {
    const q = searchParams.get("q") || ""
    // const filter = searchParams.get("filter") || "all" // Disabled as filter not supported
    const tab = searchParams.get("tab") || "all"
    const savedHistory = JSON.parse(localStorage.getItem("groups_search_history") || "[]") as string[]

    setSearchQuery(q)
    // setSelectedFilter(filter) // Disabled
    setActiveTab(tab)
    setHistory(savedHistory.slice(0, 10))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Create debounced search function once (or when pageSize changes)
  useEffect(() => {
    debouncedSearchRef.current = debounce(async (query: string, filter: string, pageNum: number) => {
      const seq = ++searchingSeqRef.current
      try {
        setSearching(true)

        // If no search query, use the already loaded groups data (ignore filter for now)
        if (!query.trim()) {
          if (seq !== searchingSeqRef.current) return
          setFilteredGroups(groups)
          setError(null)
          return
        }

        const res = await api.searchGroupsByKeyword(query)
        if (seq !== searchingSeqRef.current) return
        setFilteredGroups(res.groups)

        if (query.trim()) {
          const normalized = query.trim()
          setHistory((prev) => {
            const next = [normalized, ...prev.filter((h) => h.toLowerCase() !== normalized.toLowerCase())].slice(0, 10)
            localStorage.setItem("groups_search_history", JSON.stringify(next))
            return next
          })
        }
        setError(null)
      } catch {
        setError("Không thể tìm kiếm. Vui lòng thử lại.")
      } finally {
        if (seq === searchingSeqRef.current) setSearching(false)
      }
    }, 300)
    return () => {
      // invalidate pending results
      searchingSeqRef.current++
    }
  }, [pageSize, groups])

  useEffect(() => {
    // Only trigger search if there's an actual search query
    if (searchQuery.trim()) {
      debouncedSearchRef.current?.(searchQuery, selectedFilter, page)
    } else {
      // If no search query, use the original groups data
      setFilteredGroups(groups)
    }
  }, [searchQuery, selectedFilter, page, groups])

  // Sync searchInput with searchQuery on Enter or when searchQuery changes externally
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Sync state to URL (without scroll jump)
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery)
    // Note: filter is not supported in new search API, so not including it
    if (activeTab && activeTab !== "all") params.set("tab", activeTab)
    // page removed from URL as we use load more instead of page numbers

    const queryString = params.toString()
    const target = queryString ? `${pathname}?${queryString}` : pathname
    router.replace(target, { scroll: false })
  }, [searchQuery, selectedFilter, activeTab, pathname, router])

  // Reset page and reload groups when search/tab change
  useEffect(() => {
    // Reset to page 1 when search query or tab changes
    if (activeTab === "all" && !searchQuery.trim()) {
      // Reload groups from beginning when returning to all tab without search
      const reloadGroups = async () => {
        try {
          setLoading(true)
          const result = await api.getGroups(1, pageSize)
          setGroups(result.groups)
          setFilteredGroups(result.groups)
          setHasMore(result.hasMore)
          setPage(1)
        } catch (err) {
          console.error("Failed to reload groups:", err)
        } finally {
          setLoading(false)
        }
      }
      reloadGroups()
    } else {
      setPage(1)
    }
  }, [searchQuery, activeTab, pageSize])

  // Handle scroll for sticky search bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 100)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1
      const result = await api.getGroups(nextPage, pageSize)
      setGroups((prev) => [...prev, ...result.groups])
      setFilteredGroups((prev) => [...prev, ...result.groups])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (err) {
      setError("Không thể tải thêm nhóm. Vui lòng thử lại.")
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, pageSize])

  const handleLoadMoreJoined = useCallback(async () => {
    if (joinedLoadingMore || !joinedHasMore) return

    try {
      setJoinedLoadingMore(true)
      const nextPage = joinedPage + 1
      const result = await api.getJoinedGroups(nextPage, pageSize)
      setJoinedGroups((prev) => [...prev, ...result.groups])
      setJoinedHasMore(result.hasMore)
      setJoinedPage(nextPage)
    } catch (err) {
      setError("Không thể tải thêm nhóm đã tham gia. Vui lòng thử lại.")
    } finally {
      setJoinedLoadingMore(false)
    }
  }, [joinedLoadingMore, joinedHasMore, joinedPage, pageSize])

  const handleLoadMoreTrending = useCallback(async () => {
    if (trendingLoadingMore || !trendingHasMore) return

    try {
      setTrendingLoadingMore(true)
      const nextPage = trendingPage + 1
      const result = await api.getTrendingGroups(nextPage, 18, 0.05)
      setTrendingGroups((prev) => [...prev, ...result.groups])
      setTrendingHasMore(result.hasMore)
      setTrendingPage(nextPage)
    } catch (err) {
      setError("Không thể tải thêm nhóm phổ biến. Vui lòng thử lại.")
    } finally {
      setTrendingLoadingMore(false)
    }
  }, [trendingLoadingMore, trendingHasMore, trendingPage])

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "all" && hasMore && !loadingMore && !searchQuery.trim()) {
            handleLoadMore()
          } else if (activeTab === "joined" && joinedHasMore && !joinedLoadingMore) {
            handleLoadMoreJoined()
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
    searchQuery,
    joinedHasMore,
    joinedLoadingMore,
    trendingHasMore,
    trendingLoadingMore,
    handleLoadMore,
    handleLoadMoreJoined,
    handleLoadMoreTrending,
  ])

  const handleRetry = () => {
    setError(null)
    const loadGroups = async () => {
      try {
        setLoading(true)
        const result = await api.getGroups(1, pageSize)
        setGroups(result.groups)
        setFilteredGroups(result.groups)
        setHasMore(result.hasMore)
        setPage(1)
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
        return joinedGroups
      case "trending":
        return trendingGroups
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
    setSearchInput("")
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
      <div className="max-w-4xl mx-auto space-y-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Khám phá nhóm</h1>
            <p className="text-muted-foreground">Tham gia cộng đồng học tập và chia sẻ kiến thức</p>
          </div>
          <CreateGroupDialog
            onCreated={async () => {
              // Refresh the groups list after creating a new group
              try {
                setLoading(true)
                const result = await api.getGroups(1, pageSize)
                setGroups(result.groups)
                setFilteredGroups(result.groups)
                setHasMore(result.hasMore)
                setPage(1)
                setError(null) // Clear any previous errors
              } catch (err) {
                console.error("Failed to refresh groups after creation:", err)
                setError("Không thể tải danh sách nhóm. Vui lòng thử lại.")
                // If refresh fails, try to trigger search to update the list
                try {
                  debouncedSearchRef.current?.("", "all", 1)
                } catch (searchErr) {
                  console.error("Search fallback also failed:", searchErr)
                }
              } finally {
                setLoading(false)
              }
            }}
          />
        </div>

        {/* Search and Filters - Sticky */}
        <div
          className={`sticky top-16 z-20 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b transition-all duration-200 py-4 ${
            isScrolled ? "border-border shadow-sm" : "border-transparent"
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                ref={inputRef}
                placeholder="Tìm kiếm nhóm theo tên hoặc thẻ..."
                value={searchInput}
                onFocus={() => setShowSuggestions(true)}
                onClick={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay để cho phép click vào gợi ý
                  setTimeout(() => setShowSuggestions(false), 150)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowSuggestions(false)
                  } else if (e.key === "Enter") {
                    setSearchQuery(searchInput)
                    setShowSuggestions(false)
                  }
                }}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 w-full"
              />
              {showSuggestions && (
                <div
                  className="absolute left-0 right-0 mt-2 z-20 rounded-md border bg-popover text-popover-foreground shadow-md"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowSuggestions(false)}
                >
                  <div className="max-h-72 overflow-auto py-2">
                    {/* History first */}
                    {history.length > 0 && (
                      <>
                        <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground">Lịch sử tìm kiếm</div>
                        {history
                          .filter((h) => (searchInput ? h.toLowerCase().includes(searchInput.toLowerCase()) : true))
                          .slice(0, 5)
                          .map((h) => (
                            <div key={h} className="flex items-center justify-between px-3 py-2 gap-2 hover:bg-muted">
                              <button
                                className="flex-1 text-left text-sm"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSearchInput(h)
                                  setSearchQuery(h)
                                  setShowSuggestions(false)
                                }}
                              >
                                {h}
                              </button>
                              <button
                                className="text-xs text-muted-foreground hover:text-destructive"
                                title="Xóa mục này"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setHistory((prev) => {
                                    const next = prev.filter((x) => x !== h)
                                    localStorage.setItem("groups_search_history", JSON.stringify(next))
                                    return next
                                  })
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        <button
                          className="w-full text-left px-3 py-2 text-xs text-destructive hover:bg-muted"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            localStorage.removeItem("groups_search_history")
                            setHistory([])
                          }}
                        >
                          Xóa toàn bộ lịch sử
                        </button>
                        <div className="border-t my-1" />
                      </>
                    )}

                    {/* Tag suggestions after history */}
                    {popularCategories
                      .filter((c) => (searchInput ? c.includes(searchInput.toLowerCase()) : true))
                      .slice(0, 8)
                      .map((c) => (
                        <button
                          key={c}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSearchInput(`#${c}`)
                            setSearchQuery(`#${c}`)
                            setShowSuggestions(false)
                          }}
                        >
                          #{c}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {!searchQuery.trim() && (
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
              )}
              {(selectedFilter !== "all" || searchQuery.trim()) && (
                <Button variant="outline" size="sm" onClick={handleClearFilter} className="px-3" title="Xóa bộ lọc">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Filter Indicator removed as requested */}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="joined">Đã tham gia</TabsTrigger>
            <TabsTrigger value="trending">Phổ biến</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {(loading && groups.length === 0) ||
            (joinedGroupsLoading && activeTab === "joined") ||
            (trendingGroupsLoading && activeTab === "trending") ||
            searching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <GroupSkeleton key={i} />
                ))}
              </div>
            ) : null}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && getGroupsByTab().length === 0 && (
              <EmptyState
                title={
                  activeTab === "joined"
                    ? "Chưa tham gia nhóm nào"
                    : activeTab === "trending"
                      ? "Chưa có nhóm phổ biến"
                      : searchQuery
                        ? "Không tìm thấy nhóm"
                        : "Chưa có nhóm nào"
                }
                description={
                  activeTab === "joined"
                    ? "Tham gia các nhóm để kết nối với cộng đồng"
                    : activeTab === "trending"
                      ? "Các nhóm phổ biến sẽ xuất hiện ở đây"
                      : searchQuery
                        ? "Thử tìm kiếm với từ khóa khác"
                        : "Hãy tạo nhóm đầu tiên cho cộng đồng"
                }
                action={{
                  label: activeTab === "joined" || activeTab === "trending" ? "Khám phá nhóm" : "Tạo nhóm mới",
                  onClick: () => {
                    if (activeTab === "joined" || activeTab === "trending") {
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

            {/* Infinite Scroll Trigger - show for "all", "joined", and "trending" tabs when not searching */}
            {!loading && !error && !searchQuery.trim() && (
              <>
                {(activeTab === "all" && (hasMore || loadingMore)) ||
                (activeTab === "joined" && (joinedHasMore || joinedLoadingMore)) ||
                (activeTab === "trending" && (trendingHasMore || trendingLoadingMore)) ? (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {(activeTab === "all" && loadingMore) ||
                    (activeTab === "joined" && joinedLoadingMore) ||
                    (activeTab === "trending" && trendingLoadingMore) ? (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang tải thêm...</span>
                      </div>
                    ) : (
                      <div className="h-4" /> /* Invisible trigger target */
                    )}
                  </div>
                ) : null}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

function CreateGroupDialog({ onCreated }: { onCreated?: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Vui lòng nhập tên nhóm")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Parse tags from input (split by comma, space, or semicolon)
      const tags = tagsInput
        .split(/[,;\s]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)) // Ensure tags start with #

      const created = await api.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        tags,
        privacy: "public", // Always set to public
      })

      toast({ title: "Tạo nhóm thành công", description: `Đã tạo: ${created.name}` })
      setOpen(false)
      setName("")
      setDescription("")
      setTagsInput("")

      // Call onCreated first to refresh the groups list
      await onCreated?.()

      // Small delay to ensure data is refreshed before potential redirect
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Only redirect if we're confident the group page exists
      // For now, stay on groups list to show the newly created group
      // if (created?.id) {
      //   router.push(`/groups/${created.id}`)
      // }
    } catch (e: any) {
      const msg = e?.message || "Tạo nhóm thất bại"
      setError(msg)
      if (typeof msg === "string" && msg.toLowerCase().includes("unauthorized")) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive" as any,
        })
        window.location.href = "/login"
      } else {
        toast({ title: "Tạo nhóm thất bại", description: msg, variant: "destructive" as any })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-educonnect-primary hover:bg-educonnect-primary/90 shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Tạo nhóm
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[600px] mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên nhóm</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên nhóm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả (không bắt buộc)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả nhóm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (không bắt buộc)</label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ví dụ: math, study, group (phân cách bằng dấu phẩy)"
            />
            <p className="text-xs text-muted-foreground">
              Nhập các tag phân cách bằng dấu phẩy. Ví dụ: math, study, programming
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-educonnect-primary hover:bg-educonnect-primary/90"
          >
            {submitting ? "Đang tạo..." : "Tạo nhóm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
