"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Crown, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { formatNumber, cn } from "@/lib/utils"
import type { LeaderboardEntry } from "@/types"

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
  }
}

const getChangeIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

const getRankBadgeColor = (rank: number) => {
  if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
  if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
  if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
  if (rank <= 10) return "bg-educonnect-primary text-white"
  return "bg-muted text-muted-foreground"
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [groupLeaderboard, setGroupLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState<"weekly" | "monthly" | "all-time">("weekly")
  const [activeType, setActiveType] = useState<"individual" | "groups">("individual")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Load initial data when period or type changes
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)
        setPage(1)

        if (activeType === "individual") {
          const { items, hasMore: moreAvailable } = await api.getLeaderboard(activePeriod, 1, 20)
          setLeaderboard(items)
          setGroupLeaderboard([])
          setHasMore(moreAvailable)
        } else {
          const { items, hasMore: moreAvailable } = await api.getGroupLeaderboard(activePeriod, 1, 20)
          setGroupLeaderboard(items)
          setLeaderboard([])
          setHasMore(moreAvailable)
        }
      } catch (err) {
        setError("Không thể tải bảng xếp hạng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [activePeriod, activeType])

  // Load more data for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const nextPage = page + 1

      if (activeType === "individual") {
        const { items, hasMore: moreAvailable } = await api.getLeaderboard(activePeriod, nextPage, 20)
        setLeaderboard((prev) => [...prev, ...items])
        setHasMore(moreAvailable)
      } else {
        const { items, hasMore: moreAvailable } = await api.getGroupLeaderboard(activePeriod, nextPage, 20)
        setGroupLeaderboard((prev) => [...prev, ...items])
        setHasMore(moreAvailable)
      }

      setPage(nextPage)
    } catch (err) {
      console.error("Error loading more:", err)
    } finally {
      setLoadingMore(false)
    }
  }, [activePeriod, activeType, page, loadingMore, hasMore])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
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
  }, [loading, hasMore, loadingMore, loadMore])

  const handleRetry = () => {
    setError(null)
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        setPage(1)

        if (activeType === "individual") {
          const { items, hasMore: moreAvailable } = await api.getLeaderboard(activePeriod, 1, 20)
          setLeaderboard(items)
          setGroupLeaderboard([])
          setHasMore(moreAvailable)
        } else {
          const { items, hasMore: moreAvailable } = await api.getGroupLeaderboard(activePeriod, 1, 20)
          setGroupLeaderboard(items)
          setLeaderboard([])
          setHasMore(moreAvailable)
        }
      } catch (err) {
        setError("Không thể tải bảng xếp hạng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadLeaderboard()
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "weekly":
        return "Tuần này"
      case "monthly":
        return "Tháng này"
      case "all-time":
        return "Tất cả thời gian"
      default:
        return period
    }
  }

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Current User Rank */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thứ hạng của bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tuần này:</span>
            <div className="flex items-center space-x-2">
              <Badge className="bg-educonnect-primary">#15</Badge>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tháng này:</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">#23</Badge>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng điểm:</span>
            <span className="font-semibold text-educonnect-primary">1,250</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thống kê</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {activeType === "individual" ? "Tổng thành viên:" : "Tổng nhóm:"}
            </span>
            <span className="font-medium">
              {activeType === "individual" ? leaderboard.length : groupLeaderboard.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hoạt động tuần này:</span>
            <span className="font-medium">
              {activeType === "individual"
                ? Math.floor(leaderboard.length * 0.7)
                : Math.floor(groupLeaderboard.length * 0.7)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Điểm trung bình:</span>
            <span className="font-medium">
              {activeType === "individual"
                ? leaderboard.length > 0
                  ? Math.floor(leaderboard.reduce((sum, entry) => sum + entry.points, 0) / leaderboard.length)
                  : 0
                : groupLeaderboard.length > 0
                  ? Math.floor(groupLeaderboard.reduce((sum, entry) => sum + entry.points, 0) / groupLeaderboard.length)
                  : 0}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            Mẹo tăng điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Đăng bài viết chất lượng (+50 điểm)</p>
          <p>• Bình luận hữu ích (+10 điểm)</p>
          <p>• Nhận like từ cộng đồng (+5 điểm)</p>
          <p>• Tham gia thảo luận nhóm (+15 điểm)</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Bảng xếp hạng</h1>
          </div>
          <p className="text-muted-foreground text-lg">Theo dõi thành tích và cạnh tranh lành mạnh với cộng đồng</p>
        </div>

        {/* Period and Type Selection */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Tabs
            value={activePeriod}
            onValueChange={(value) => setActivePeriod(value as any)}
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weekly">Tuần</TabsTrigger>
              <TabsTrigger value="monthly">Tháng</TabsTrigger>
              <TabsTrigger value="all-time">Tổng</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={activeType} onValueChange={(value) => setActiveType(value as any)} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Cá nhân</TabsTrigger>
              <TabsTrigger value="groups">Nhóm</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Top 3 Podium */}
        {!loading && !error && activeType === "individual" && leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* 2nd Place */}
            <div className="text-center pt-8">
              <div className="relative">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto border-4 border-gray-300">
                  <AvatarImage src={leaderboard[1]?.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{leaderboard[1]?.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
              </div>
              <h3 className="font-semibold mt-2 text-sm sm:text-base line-clamp-1">
                {leaderboard[1]?.user.displayName}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{formatNumber(leaderboard[1]?.points)} điểm</p>
              <div className="h-16 bg-gray-200 rounded-t-lg mt-4 flex items-end justify-center pb-2">
                <span className="text-xl sm:text-2xl font-bold text-gray-600">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="relative">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto border-4 border-yellow-400">
                  <AvatarImage src={leaderboard[0]?.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{leaderboard[0]?.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-3 -right-3">
                  <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                </div>
              </div>
              <h3 className="font-bold mt-2 text-base sm:text-lg line-clamp-1">{leaderboard[0]?.user.displayName}</h3>
              <p className="text-educonnect-primary font-semibold text-sm sm:text-base">
                {formatNumber(leaderboard[0]?.points)} điểm
              </p>
              <div className="h-24 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-4 flex items-end justify-center pb-2">
                <span className="text-2xl sm:text-3xl font-bold text-white">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center pt-12">
              <div className="relative">
                <Avatar className="h-10 w-10 sm:h-14 sm:w-14 mx-auto border-4 border-amber-500">
                  <AvatarImage src={leaderboard[2]?.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{leaderboard[2]?.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
              <h3 className="font-semibold mt-2 text-sm sm:text-base line-clamp-1">
                {leaderboard[2]?.user.displayName}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{formatNumber(leaderboard[2]?.points)} điểm</p>
              <div className="h-12 bg-amber-200 rounded-t-lg mt-4 flex items-end justify-center pb-2">
                <span className="text-lg sm:text-xl font-bold text-amber-700">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span>Bảng xếp hạng {getPeriodLabel(activePeriod)}</span>
              {activeType === "individual" && (
                <>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    {leaderboard.length} thành viên
                  </Badge>
                  <Badge variant="secondary" className="sm:hidden text-xs">
                    {leaderboard.length}
                  </Badge>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {loading && (
              <div className="space-y-4 p-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                    </div>
                    <div className="h-6 bg-muted rounded w-16 animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="p-4">
                <ErrorState description={error} onRetry={handleRetry} />
              </div>
            )}

            {!loading && !error && activeType === "individual" && leaderboard.length === 0 && (
              <EmptyState
                title="Chưa có dữ liệu xếp hạng"
                description="Bảng xếp hạng sẽ được cập nhật khi có hoạt động từ cộng đồng"
              />
            )}

            {!loading && !error && activeType === "individual" && leaderboard.length > 0 && (
              <div className="space-y-1 sm:space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={`${entry.user.id}-${entry.rank}`}
                    className={cn(
                      "flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 rounded-lg transition-colors hover:bg-muted/50 border-b last:border-0 sm:border-0",
                      entry.rank <= 3 && "bg-gradient-to-r from-muted/30 to-transparent"
                    )}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 sm:w-12 flex-shrink-0">
                      <div
                        className={cn(
                          "px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold",
                          getRankBadgeColor(entry.rank)
                        )}
                      >
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                      </div>
                    </div>

                    {/* User Info */}
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-border">
                      <AvatarImage src={entry.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {entry.user.displayName?.charAt(0) || entry.user.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${entry.user.id}`}
                        className="font-medium text-sm sm:text-base hover:text-educonnect-primary transition-colors truncate block"
                      >
                        {entry.user.displayName || entry.user.username || "Unknown User"}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">@{entry.user.username}</p>
                    </div>

                    {/* Points and Change */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-educonnect-primary text-sm sm:text-base">
                        {formatNumber(entry.points)}
                      </div>
                      <div className="flex items-center justify-end space-x-1 text-[10px] sm:text-xs">
                        {getChangeIcon(entry.change)}
                        <span
                          className={cn(
                            entry.change > 0
                              ? "text-green-600"
                              : entry.change < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {entry.change > 0 ? `+${entry.change}` : entry.change}
                        </span>
                      </div>
                    </div>

                    {/* Level Badge - Hidden on very small screens */}
                    <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                      Lv.{entry.user.level}
                    </Badge>
                  </div>
                ))}

                {/* Infinite scroll trigger */}
                <div ref={loadMoreRef} className="py-4 flex justify-center">
                  {loadingMore && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Đang tải thêm...</span>
                    </div>
                  )}
                  {!loadingMore && !hasMore && leaderboard.length > 0 && (
                    <span className="text-sm text-muted-foreground">Đã hiển thị tất cả kết quả</span>
                  )}
                </div>
              </div>
            )}

            {!loading && !error && activeType === "groups" && groupLeaderboard.length === 0 && (
              <EmptyState
                title="Chưa có dữ liệu xếp hạng"
                description="Bảng xếp hạng sẽ được cập nhật khi có hoạt động từ cộng đồng"
              />
            )}

            {!loading && !error && activeType === "groups" && groupLeaderboard.length > 0 && (
              <div className="space-y-1 sm:space-y-2">
                {groupLeaderboard.map((entry, index) => (
                  <div
                    key={`${entry.group.id}-${entry.rank}`}
                    className={cn(
                      "flex items-center space-x-2 sm:space-x-4 p-3 sm:p-4 rounded-lg transition-colors hover:bg-muted/50 border-b last:border-0 sm:border-0",
                      entry.rank <= 3 && "bg-gradient-to-r from-muted/30 to-transparent"
                    )}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 sm:w-12 flex-shrink-0">
                      <div
                        className={cn(
                          "px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold",
                          getRankBadgeColor(entry.rank)
                        )}
                      >
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                      </div>
                    </div>

                    {/* Group Info */}
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-border">
                      <AvatarImage src={entry.group.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{entry.group.name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/groups/${entry.group.id}`}
                        className="font-medium text-sm sm:text-base hover:text-educonnect-primary transition-colors truncate block"
                      >
                        {entry.group.name || "Unknown Group"}
                      </Link>
                    </div>

                    {/* Points and Change */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-educonnect-primary text-sm sm:text-base">
                        {formatNumber(entry.points)}
                      </div>
                      <div className="flex items-center justify-end space-x-1 text-[10px] sm:text-xs">
                        {getChangeIcon(entry.change)}
                        <span
                          className={cn(
                            entry.change > 0
                              ? "text-green-600"
                              : entry.change < 0
                                ? "text-red-600"
                                : "text-muted-foreground"
                          )}
                        >
                          {entry.change > 0 ? `+${entry.change}` : entry.change}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Infinite scroll trigger for groups */}
                <div className="py-4 flex justify-center">
                  {loadingMore ? (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Đang tải thêm...</span>
                    </div>
                  ) : (
                    !hasMore &&
                    groupLeaderboard.length > 0 && (
                      <span className="text-sm text-muted-foreground">Đã hiển thị tất cả kết quả</span>
                    )
                  )}
                  {/* Reuse the ref for observer */}
                  {!loadingMore && hasMore && <div ref={loadMoreRef} className="h-4 w-full" />}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold mb-2">Muốn leo lên bảng xếp hạng?</h3>
          <p className="text-muted-foreground mb-4">
            Tham gia tích cực, chia sẻ kiến thức và giúp đỡ cộng đồng để tăng điểm
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button className="bg-educonnect-primary hover:bg-educonnect-primary/90" asChild>
              <Link href="/compose">Viết bài mới</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/groups">Tham gia nhóm</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
