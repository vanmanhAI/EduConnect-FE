"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, Crown, Star } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState<"weekly" | "monthly" | "all-time">("weekly")
  const [activeType, setActiveType] = useState<"individual" | "groups">("individual")

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getLeaderboard(activePeriod)
        setLeaderboard(data)
      } catch (err) {
        setError("Không thể tải bảng xếp hạng. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [activePeriod])

  const handleRetry = () => {
    setError(null)
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        const data = await api.getLeaderboard(activePeriod)
        setLeaderboard(data)
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
            <span className="text-muted-foreground">Tổng thành viên:</span>
            <span className="font-medium">{leaderboard.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hoạt động tuần này:</span>
            <span className="font-medium">{Math.floor(leaderboard.length * 0.7)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Điểm trung bình:</span>
            <span className="font-medium">
              {leaderboard.length > 0
                ? Math.floor(leaderboard.reduce((sum, entry) => sum + entry.points, 0) / leaderboard.length)
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
        {!loading && !error && leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* 2nd Place */}
            <div className="text-center pt-8">
              <div className="relative">
                <Avatar className="h-16 w-16 mx-auto border-4 border-gray-300">
                  <AvatarImage src={leaderboard[1]?.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{leaderboard[1]?.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  <Medal className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <h3 className="font-semibold mt-2">{leaderboard[1]?.user.displayName}</h3>
              <p className="text-sm text-muted-foreground">{formatNumber(leaderboard[1]?.points)} điểm</p>
              <div className="h-16 bg-gray-200 rounded-t-lg mt-4 flex items-end justify-center pb-2">
                <span className="text-2xl font-bold text-gray-600">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <div className="relative">
                <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-400">
                  <AvatarImage src={leaderboard[0]?.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{leaderboard[0]?.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-3 -right-3">
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
              <h3 className="font-bold mt-2 text-lg">{leaderboard[0]?.user.displayName}</h3>
              <p className="text-educonnect-primary font-semibold">{formatNumber(leaderboard[0]?.points)} điểm</p>
              <div className="h-24 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg mt-4 flex items-end justify-center pb-2">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="text-center pt-12">
              <div className="relative">
                <Avatar className="h-14 w-14 mx-auto border-4 border-amber-500">
                  <AvatarImage src={leaderboard[2]?.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{leaderboard[2]?.user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <h3 className="font-semibold mt-2">{leaderboard[2]?.user.displayName}</h3>
              <p className="text-sm text-muted-foreground">{formatNumber(leaderboard[2]?.points)} điểm</p>
              <div className="h-12 bg-amber-200 rounded-t-lg mt-4 flex items-end justify-center pb-2">
                <span className="text-xl font-bold text-amber-700">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bảng xếp hạng {getPeriodLabel(activePeriod)}</span>
              <Badge variant="secondary">{leaderboard.length} thành viên</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-4">
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

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && leaderboard.length === 0 && (
              <EmptyState
                title="Chưa có dữ liệu xếp hạng"
                description="Bảng xếp hạng sẽ được cập nhật khi có hoạt động từ cộng đồng"
              />
            )}

            {!loading && !error && leaderboard.length > 0 && (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user.id}
                    className={cn(
                      "flex items-center space-x-4 p-4 rounded-lg transition-colors hover:bg-muted/50",
                      entry.rank <= 3 && "bg-gradient-to-r from-muted/30 to-transparent"
                    )}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12">
                      <div className={cn("px-2 py-1 rounded-full text-xs font-bold", getRankBadgeColor(entry.rank))}>
                        {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                      </div>
                    </div>

                    {/* User Info */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={entry.user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{entry.user.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${entry.user.id}`}
                        className="font-medium hover:text-educonnect-primary transition-colors"
                      >
                        {entry.user.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">@{entry.user.username}</p>
                    </div>

                    {/* Points and Change */}
                    <div className="text-right">
                      <div className="font-semibold text-educonnect-primary">{formatNumber(entry.points)}</div>
                      <div className="flex items-center space-x-1 text-xs">
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

                    {/* Level Badge */}
                    <Badge variant="outline" className="text-xs">
                      Level {entry.user.level}
                    </Badge>
                  </div>
                ))}
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
