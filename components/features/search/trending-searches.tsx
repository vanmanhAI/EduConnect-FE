"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Search, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"

interface TrendingSearch {
  query: string
  count: number
  trend: "up" | "down" | "stable"
  category: "posts" | "groups" | "users" | "tags"
}

interface TrendingSearchesProps {
  onSearch: (query: string) => void
  className?: string
}

export function TrendingSearches({ onSearch, className }: TrendingSearchesProps) {
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrendingSearches()
  }, [])

  const loadTrendingSearches = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock trending searches data
      const mockTrending: TrendingSearch[] = [
        { query: "react hooks", count: 45, trend: "up", category: "posts" },
        { query: "javascript tips", count: 38, trend: "up", category: "posts" },
        { query: "css grid", count: 32, trend: "stable", category: "posts" },
        { query: "typescript", count: 28, trend: "down", category: "tags" },
        { query: "nextjs", count: 25, trend: "up", category: "posts" },
        { query: "tailwind css", count: 22, trend: "stable", category: "posts" },
        { query: "nodejs", count: 19, trend: "up", category: "posts" },
        { query: "python", count: 16, trend: "down", category: "tags" },
      ]

      setTrendingSearches(mockTrending)
    } catch (error) {
      console.error("Failed to load trending searches:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "↗"
      case "down":
        return "↘"
      case "stable":
        return "→"
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      case "stable":
        return "text-gray-600"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "posts":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "groups":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "users":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "tags":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tìm kiếm thịnh hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted animate-pulse rounded w-24" />
                <div className="h-4 bg-muted animate-pulse rounded w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tìm kiếm thịnh hành
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-66">
          <div className="space-y-3">
            {trendingSearches.slice(0, 8).map((item, index) => (
              <div key={item.query} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start p-0 h-auto font-normal text-left flex-1 min-w-0"
                    onClick={() => onSearch(item.query)}
                  >
                    <span className="truncate">{item.query}</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </Badge>
                  <span className={`text-xs font-medium ${getTrendColor(item.trend)}`}>{getTrendIcon(item.trend)}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full" onClick={loadTrendingSearches}>
            <Clock className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
