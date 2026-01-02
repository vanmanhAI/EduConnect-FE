"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TrendingUp, Users, Hash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { api } from "@/lib/api"
import type { User, Group } from "@/types"

interface RightSidebarProps {
  children?: React.ReactNode
}

export function RightSidebar({ children }: RightSidebarProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([])
  const [trendingTags] = useState([
    { name: "javascript", count: 234 },
    { name: "react", count: 189 },
    { name: "typescript", count: 156 },
    { name: "nextjs", count: 134 },
    { name: "tailwind", count: 98 },
  ])

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const [users, groupsResult] = await Promise.all([api.getUsers(), api.getGroups(1, 3)])
        setSuggestedUsers(users.slice(0, 3))
        setSuggestedGroups(groupsResult.groups)
      } catch (error) {
        console.error("Failed to load suggestions:", error)
      }
    }
    loadSuggestions()
  }, [])

  return (
    <aside className="fixed top-16 right-0 z-30 hidden h-[calc(100vh-4rem)] w-80 custom-scrollbar border-l bg-background p-6 lg:block">
      <div className="space-y-6">
        {children}

        {/* Trending Tags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Hash className="mr-2 h-4 w-4" />
              Thẻ thịnh hành
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendingTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/search?q=${encodeURIComponent(`#${tag.name}`)}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    #{tag.name}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{tag.count} bài viết</span>
              </Link>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
              <Link href="/search">Xem thêm</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Suggested Groups */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Users className="mr-2 h-4 w-4" />
              Nhóm gợi ý
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedGroups.map((group) => (
              <div key={group.id} className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={group.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link href={`/groups/${group.id}`} className="text-sm font-medium hover:underline truncate block">
                    {group.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{group.memberCount} thành viên</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
              <Link href="/groups">Khám phá nhóm</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Suggested People */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <TrendingUp className="mr-2 h-4 w-4" />
              Gợi ý kết nối
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <AvatarWithStatus
                  src={user.avatar}
                  fallback={user.displayName?.charAt(0) || user.username?.charAt(0) || "?"}
                  alt={user.displayName || user.username || "User"}
                  isOnline={user.isOnline}
                  showStatus={user.profileVisibility === "public"}
                  className="h-8 w-8"
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`} className="text-sm font-medium hover:underline truncate block">
                    {user.displayName || user.username || "Unknown User"}
                  </Link>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
              <Link href="/people">Xem thêm</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
