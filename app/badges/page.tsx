"use client"

import { useState, useEffect } from "react"
import { Award, Lock, CheckCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { AppShell } from "@/components/layout/app-shell"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Badge as BadgeType } from "@/types"

const getRarityColor = (rarity: BadgeType["rarity"]) => {
  switch (rarity) {
    case "common":
      return "bg-gray-100 border-gray-300 text-gray-700"
    case "rare":
      return "bg-blue-100 border-blue-300 text-blue-700"
    case "epic":
      return "bg-purple-100 border-purple-300 text-purple-700"
    case "legendary":
      return "bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 text-yellow-800"
    default:
      return "bg-gray-100 border-gray-300 text-gray-700"
  }
}

const getRarityLabel = (rarity: BadgeType["rarity"]) => {
  switch (rarity) {
    case "common":
      return "Phổ biến"
    case "rare":
      return "Hiếm"
    case "epic":
      return "Sử thi"
    case "legendary":
      return "Huyền thoại"
    default:
      return rarity
  }
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Mock user progress data
  const [userProgress] = useState({
    totalBadges: 12,
    earnedBadges: 4,
    points: 1250,
    level: 5,
  })

  useEffect(() => {
    const loadBadges = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.getBadges()

        // Mock: Add earned status and progress to some badges
        const badgesWithProgress = data.map((badge, index) => ({
          ...badge,
          earnedAt: index < 4 ? new Date() : undefined, // First 4 badges are earned
          progress: index < 4 ? 100 : Math.floor(Math.random() * 80), // Progress for unearned badges
        }))

        setBadges(badgesWithProgress)
      } catch (err) {
        setError("Không thể tải danh sách huy hiệu. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }

    loadBadges()
  }, [])

  const handleRetry = () => {
    setError(null)
    const loadBadges = async () => {
      try {
        setLoading(true)
        const data = await api.getBadges()
        const badgesWithProgress = data.map((badge, index) => ({
          ...badge,
          earnedAt: index < 4 ? new Date() : undefined,
          progress: index < 4 ? 100 : Math.floor(Math.random() * 80),
        }))
        setBadges(badgesWithProgress)
      } catch (err) {
        setError("Không thể tải danh sách huy hiệu. Vui lòng thử lại.")
      } finally {
        setLoading(false)
      }
    }
    loadBadges()
  }

  const getFilteredBadges = () => {
    switch (activeTab) {
      case "earned":
        return badges.filter((badge) => badge.earnedAt)
      case "available":
        return badges.filter((badge) => !badge.earnedAt)
      default:
        return badges
    }
  }

  const earnedBadges = badges.filter((badge) => badge.earnedAt)
  const availableBadges = badges.filter((badge) => !badge.earnedAt)

  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Award className="mr-2 h-4 w-4 text-yellow-500" />
            Tiến độ huy hiệu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-educonnect-primary">
              {earnedBadges.length}/{badges.length}
            </div>
            <p className="text-sm text-muted-foreground">Huy hiệu đã đạt</p>
          </div>

          <Progress value={(earnedBadges.length / badges.length) * 100} className="h-2" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Điểm hiện tại:</span>
              <span className="font-medium">{userProgress.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cấp độ:</span>
              <span className="font-medium">Level {userProgress.level}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rarity Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Phân loại độ hiếm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {["common", "rare", "epic", "legendary"].map((rarity) => {
            const count = badges.filter((b) => b.rarity === rarity).length
            const earnedCount = earnedBadges.filter((b) => b.rarity === rarity).length

            return (
              <div key={rarity} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className={cn("w-3 h-3 rounded-full", getRarityColor(rarity as BadgeType["rarity"]).split(" ")[0])}
                  />
                  <span>{getRarityLabel(rarity as BadgeType["rarity"])}</span>
                </div>
                <span className="font-medium">
                  {earnedCount}/{count}
                </span>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Next Badge */}
      {availableBadges.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Huy hiệu tiếp theo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <div className="text-3xl mb-2">{availableBadges[0].icon}</div>
              <h3 className="font-medium">{availableBadges[0].name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{availableBadges[0].criteria}</p>
            </div>
            <Progress value={availableBadges[0].progress || 0} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">{availableBadges[0].progress || 0}% hoàn thành</p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Award className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">Huy hiệu thành tích</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Thu thập huy hiệu bằng cách tham gia tích cực và đóng góp cho cộng đồng
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-educonnect-primary">{earnedBadges.length}</div>
              <p className="text-sm text-muted-foreground">Đã đạt</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-muted-foreground">{availableBadges.length}</div>
              <p className="text-sm text-muted-foreground">Chưa đạt</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {earnedBadges.filter((b) => b.rarity === "legendary").length}
              </div>
              <p className="text-sm text-muted-foreground">Huyền thoại</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((earnedBadges.length / badges.length) * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="all">Tất cả ({badges.length})</TabsTrigger>
            <TabsTrigger value="earned">Đã đạt ({earnedBadges.length})</TabsTrigger>
            <TabsTrigger value="available">Chưa đạt ({availableBadges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6 text-center">
                      <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-full mx-auto animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && <ErrorState description={error} onRetry={handleRetry} />}

            {!loading && !error && getFilteredBadges().length === 0 && (
              <EmptyState
                title={
                  activeTab === "earned"
                    ? "Chưa có huy hiệu nào"
                    : activeTab === "available"
                      ? "Đã đạt tất cả huy hiệu"
                      : "Không có huy hiệu"
                }
                description={
                  activeTab === "earned"
                    ? "Tham gia hoạt động để nhận huy hiệu đầu tiên"
                    : activeTab === "available"
                      ? "Chúc mừng! Bạn đã thu thập tất cả huy hiệu"
                      : "Danh sách huy hiệu sẽ được cập nhật"
                }
              />
            )}

            {!loading && !error && getFilteredBadges().length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {getFilteredBadges().map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card
                          className={cn(
                            "relative transition-all duration-200 hover:shadow-lg cursor-pointer",
                            badge.earnedAt
                              ? "border-2 border-green-200 bg-green-50/50"
                              : "opacity-75 hover:opacity-100",
                            getRarityColor(badge.rarity)
                          )}
                        >
                          <CardContent className="p-6 text-center space-y-3">
                            {/* Badge Icon */}
                            <div className="relative">
                              <div className={cn("text-4xl mx-auto", !badge.earnedAt && "grayscale opacity-50")}>
                                {badge.icon}
                              </div>

                              {badge.earnedAt && (
                                <div className="absolute -top-1 -right-1">
                                  <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                                </div>
                              )}

                              {!badge.earnedAt && (
                                <div className="absolute -top-1 -right-1">
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Badge Info */}
                            <div>
                              <h3 className="font-semibold text-sm">{badge.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                            </div>

                            {/* Rarity Badge */}
                            <Badge variant="secondary" className="text-xs">
                              {getRarityLabel(badge.rarity)}
                            </Badge>

                            {/* Progress Bar for unearned badges */}
                            {!badge.earnedAt && badge.progress !== undefined && (
                              <div className="space-y-1">
                                <Progress value={badge.progress} className="h-1" />
                                <p className="text-xs text-muted-foreground">{badge.progress}%</p>
                              </div>
                            )}

                            {/* Earned Date */}
                            {badge.earnedAt && (
                              <p className="text-xs text-green-600 font-medium">
                                Đạt được {badge.earnedAt.toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{badge.icon}</span>
                            <div>
                              <p className="font-semibold">{badge.name}</p>
                              <Badge variant="secondary" className="text-xs">
                                {getRarityLabel(badge.rarity)}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm">{badge.description}</p>
                          <div className="border-t pt-2">
                            <p className="text-xs text-muted-foreground">
                              <strong>Điều kiện:</strong> {badge.criteria}
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Achievement Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5 text-blue-500" />
              Hướng dẫn đạt huy hiệu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2 text-green-600">Hoạt động cộng đồng</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Đăng bài viết chất lượng</li>
                  <li>• Bình luận hữu ích</li>
                  <li>• Chia sẻ kiến thức</li>
                  <li>• Giúp đỡ thành viên khác</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-600">Tham gia tích cực</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Tham gia thảo luận nhóm</li>
                  <li>• Theo dõi và kết nối</li>
                  <li>• Tham dự sự kiện</li>
                  <li>• Đóng góp dự án</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
