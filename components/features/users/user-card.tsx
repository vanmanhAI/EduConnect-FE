"use client"

import { useState } from "react"
import Link from "next/link"
import { UserPlus, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { formatNumber } from "@/lib/utils"
import { api } from "@/lib/api"
import type { User } from "@/types"

interface UserCardProps {
  user: User
  showFollowButton?: boolean
}

export function UserCard({ user, showFollowButton = true }: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [followerCount, setFollowerCount] = useState(user.followers || user.followersCount || 0)
  const [loading, setLoading] = useState(false)

  const handleFollowToggle = async () => {
    if (loading) return

    setLoading(true)
    const previousIsFollowing = isFollowing
    const previousFollowerCount = followerCount

    try {
      if (isFollowing) {
        await api.unfollowUser(user.id)
        setIsFollowing(false)
        setFollowerCount((prev) => prev - 1)
      } else {
        await api.followUser(user.id)
        setIsFollowing(true)
        setFollowerCount((prev) => prev + 1)
      }
    } catch (error: any) {
      console.error("Failed to toggle follow:", error)
      console.log("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      })

      // Revert state changes
      setIsFollowing(previousIsFollowing)
      setFollowerCount(previousFollowerCount)

      // If error indicates user is already following, update state to reflect reality
      if (error.message && error.message.includes("đã theo dõi")) {
        console.log("User is already following, updating state")
        setIsFollowing(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <AvatarWithStatus
              src={user.avatar}
              fallback={user.displayName?.charAt(0) || user.username?.charAt(0) || "?"}
              alt={user.displayName || user.username || "User"}
              isOnline={user.isOnline}
              showStatus={user.profileVisibility === "public"}
              className="h-12 w-12"
            />
            <div>
              <Link
                href={`/profile/${user.id}`}
                className="font-semibold hover:text-educonnect-primary transition-colors"
              >
                {user.displayName || user.username || "Unknown User"}
              </Link>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
          </div>

          {showFollowButton && (
            <Button
              onClick={handleFollowToggle}
              disabled={loading}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={!isFollowing ? "bg-educonnect-primary hover:bg-educonnect-primary/90" : ""}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="mr-1 h-4 w-4" />
                  Đang theo dõi
                </>
              ) : (
                <>
                  <UserPlus className="mr-1 h-4 w-4" />
                  Theo dõi
                </>
              )}
            </Button>
          )}
        </div>

        {user.bio && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{user.bio}</p>}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{formatNumber(followerCount)}</strong> người theo dõi
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">{formatNumber(user.following)}</strong> đang theo dõi
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              Level {user.level}
            </Badge>
            <span className="text-xs text-educonnect-primary font-medium">{formatNumber(user.points)} điểm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
