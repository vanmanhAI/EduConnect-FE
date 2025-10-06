"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Search, Clock, Eye, BarChart3, Users, FileText, Hash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api"

interface SearchAnalytics {
  totalSearches: number
  uniqueQueries: number
  popularQueries: Array<{
    query: string
    count: number
    trend: "up" | "down" | "stable"
  }>
  searchByType: {
    posts: number
    groups: number
    users: number
  }
  searchByTime: Array<{
    hour: number
    count: number
  }>
  topTags: Array<{
    tag: string
    count: number
  }>
  userEngagement: {
    clickThroughRate: number
    averageTimeOnResults: number
    bounceRate: number
  }
}

interface SearchAnalyticsProps {
  className?: string
}

export function SearchAnalytics({ className }: SearchAnalyticsProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d")

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock analytics data
      const mockAnalytics: SearchAnalytics = {
        totalSearches: 1247,
        uniqueQueries: 89,
        popularQueries: [
          { query: "react hooks", count: 45, trend: "up" },
          { query: "javascript tips", count: 38, trend: "up" },
          { query: "css grid", count: 32, trend: "stable" },
          { query: "typescript", count: 28, trend: "down" },
          { query: "nextjs", count: 25, trend: "up" },
          { query: "tailwind css", count: 22, trend: "stable" },
          { query: "nodejs", count: 19, trend: "up" },
          { query: "python", count: 16, trend: "down" },
        ],
        searchByType: {
          posts: 65,
          groups: 25,
          users: 10,
        },
        searchByTime: [
          { hour: 0, count: 12 },
          { hour: 1, count: 8 },
          { hour: 2, count: 5 },
          { hour: 3, count: 3 },
          { hour: 4, count: 2 },
          { hour: 5, count: 4 },
          { hour: 6, count: 8 },
          { hour: 7, count: 15 },
          { hour: 8, count: 28 },
          { hour: 9, count: 35 },
          { hour: 10, count: 42 },
          { hour: 11, count: 38 },
          { hour: 12, count: 45 },
          { hour: 13, count: 48 },
          { hour: 14, count: 52 },
          { hour: 15, count: 55 },
          { hour: 16, count: 58 },
          { hour: 17, count: 62 },
          { hour: 18, count: 68 },
          { hour: 19, count: 72 },
          { hour: 20, count: 65 },
          { hour: 21, count: 45 },
          { hour: 22, count: 32 },
          { hour: 23, count: 18 },
        ],
        topTags: [
          { tag: "javascript", count: 156 },
          { tag: "react", count: 134 },
          { tag: "typescript", count: 98 },
          { tag: "css", count: 87 },
          { tag: "html", count: 76 },
          { tag: "nodejs", count: 65 },
          { tag: "python", count: 54 },
          { tag: "design", count: 43 },
        ],
        userEngagement: {
          clickThroughRate: 68.5,
          averageTimeOnResults: 45.2,
          bounceRate: 23.8,
        },
      }

      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Không thể tải dữ liệu phân tích</p>
            <Button variant="outline" onClick={loadAnalytics} className="mt-2">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const maxHourlyCount = Math.max(...analytics.searchByTime.map((item) => item.count))

  return (
    <div className={className}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Phân tích tìm kiếm</h2>
        <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <TabsList>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
            <TabsTrigger value="90d">90 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tìm kiếm</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSearches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% so với tuần trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Truy vấn duy nhất</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueQueries}</div>
            <p className="text-xs text-muted-foreground">+8% so với tuần trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ nhấp chuột</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userEngagement.clickThroughRate}%</div>
            <p className="text-xs text-muted-foreground">+2.1% so với tuần trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời gian trung bình</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userEngagement.averageTimeOnResults}s</div>
            <p className="text-xs text-muted-foreground">+5.2s so với tuần trước</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Truy vấn phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.popularQueries.map((item, index) => (
                <div key={item.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                    <span className="font-medium">{item.query}</span>
                    <Badge
                      variant={item.trend === "up" ? "default" : item.trend === "down" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {item.trend === "up" ? "↗" : item.trend === "down" ? "↘" : "→"}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tìm kiếm theo loại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Bài viết</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={analytics.searchByType.posts} className="w-20" />
                  <span className="text-sm font-medium">{analytics.searchByType.posts}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Nhóm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={analytics.searchByType.groups} className="w-20" />
                  <span className="text-sm font-medium">{analytics.searchByType.groups}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Người dùng</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={analytics.searchByType.users} className="w-20" />
                  <span className="text-sm font-medium">{analytics.searchByType.users}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Activity by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hoạt động theo giờ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.searchByTime.map((item) => (
                <div key={item.hour} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{item.hour.toString().padStart(2, "0")}:00</span>
                  <div className="flex-1">
                    <Progress value={(item.count / maxHourlyCount) * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Thẻ phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topTags.map((tag, index) => (
                <div key={tag.tag} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                    <Badge variant="secondary">#{tag.tag}</Badge>
                  </div>
                  <span className="text-sm font-medium">{tag.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
