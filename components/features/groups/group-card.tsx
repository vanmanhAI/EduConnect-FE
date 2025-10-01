"use client"

import { useState, memo, useCallback } from "react"
import Link from "next/link"
import { Users, Lock, Check, Clock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatNumber } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Group } from "@/types"

interface GroupCardProps {
  group: Group
}

function GroupCardComponent({ group }: GroupCardProps) {
  const [joinStatus, setJoinStatus] = useState(group.joinStatus || "not-joined")
  const [memberCount, setMemberCount] = useState(group.memberCount)
  const [loading, setLoading] = useState(false)
  const [coverImageError, setCoverImageError] = useState(false)
  const [avatarImageError, setAvatarImageError] = useState(false)

  const handleJoinToggle = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      if (joinStatus === "joined") {
        await api.leaveGroup(group.id)
        setJoinStatus("not-joined")
        setMemberCount((prev) => prev - 1)
      } else {
        await api.joinGroup(group.id)
        setJoinStatus(group.isPrivate ? "pending" : "joined")
        if (!group.isPrivate) {
          setMemberCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("Failed to toggle group membership:", error)
    } finally {
      setLoading(false)
    }
  }, [loading, joinStatus, group.id, group.isPrivate])

  const handleCoverImageError = useCallback(() => {
    setCoverImageError(true)
  }, [])

  const handleAvatarImageError = useCallback(() => {
    setAvatarImageError(true)
  }, [])

  const getJoinButtonContent = () => {
    switch (joinStatus) {
      case "joined":
        return (
          <>
            <Check className="mr-1 h-4 w-4" />
            Đã tham gia
          </>
        )
      case "pending":
        return (
          <>
            <Clock className="mr-1 h-4 w-4" />
            Chờ duyệt
          </>
        )
      default:
        return "Tham gia"
    }
  }

  const getJoinButtonVariant = () => {
    switch (joinStatus) {
      case "joined":
        return "outline" as const
      case "pending":
        return "secondary" as const
      default:
        return "default" as const
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02] group flex flex-col h-full">
      <CardHeader className="pb-3 space-y-3 sm:space-y-4">
        {/* Cover Image - Responsive with error handling */}
        {group.coverImage && !coverImageError && (
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 sm:mb-4">
            <img
              src={group.coverImage}
              alt={`Ảnh bìa của nhóm ${group.name}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleCoverImageError}
              loading="lazy"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {/* Responsive Avatar with error handling */}
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
              <AvatarImage
                src={!avatarImageError ? group.avatar || undefined : undefined}
                alt={`Avatar của nhóm ${group.name}`}
                onError={handleAvatarImageError}
              />
              <AvatarFallback
                className="bg-educonnect-primary text-white font-semibold text-sm sm:text-base"
                aria-label={`Avatar mặc định cho nhóm ${group.name}`}
              >
                {group.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Link
                  href={`/groups/${group.id}`}
                  className="font-semibold text-base sm:text-lg hover:text-educonnect-primary transition-colors duration-200 line-clamp-1 focus:outline-none focus:ring-2 focus:ring-educonnect-primary focus:ring-offset-2 rounded"
                  aria-label={`Xem chi tiết nhóm ${group.name}`}
                  tabIndex={0}
                >
                  {group.name}
                </Link>
                {group.isPrivate && (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-label="Nhóm riêng tư" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span aria-label={`${formatNumber(memberCount)} thành viên trong nhóm`}>
                  {formatNumber(memberCount)} thành viên
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
        {/* Description with text truncation */}
        <p
          className="text-muted-foreground text-sm leading-relaxed line-clamp-3"
          title={group.description}
          aria-label={`Mô tả nhóm: ${group.description}`}
        >
          {group.description}
        </p>

        {/* Tags */}
        {(group.tags || group.tag || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2" role="list" aria-label="Thẻ tag của nhóm">
            {(group.tags || group.tag || []).slice(0, 5).map((tag) => {
              const tagName = typeof tag === "string" ? tag : tag.name
              const tagId = typeof tag === "string" ? tag : tag.id
              return (
                <Badge
                  key={tagId}
                  variant="secondary"
                  className="text-xs transition-colors hover:bg-educonnect-primary/10"
                  role="listitem"
                  aria-label={`Tag ${tagName}`}
                >
                  {tagName.startsWith("#") ? tagName : `#${tagName}`}
                </Badge>
              )
            })}
            {(group.tags || group.tag || []).length > 5 && (
              <Badge
                variant="outline"
                className="text-xs"
                aria-label={`Và ${(group.tags || group.tag || []).length - 5} tag khác`}
              >
                +{(group.tags || group.tag || []).length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Spacer to push actions to bottom */}
        <div className="flex-1"></div>

        {/* Actions - Always at the bottom */}
        <div className="flex items-center justify-between pt-2 gap-2 mt-auto">
          <div className="text-xs text-muted-foreground min-w-0">
            <span className="hidden sm:inline">Tạo </span>
            <time
              dateTime={new Date(group.createdAt).toISOString()}
              aria-label={`Ngày tạo nhóm: ${new Date(group.createdAt).toLocaleDateString("vi-VN")}`}
            >
              {new Date(group.createdAt).toLocaleDateString("vi-VN")}
            </time>
          </div>

          <Button
            onClick={handleJoinToggle}
            disabled={loading}
            variant={getJoinButtonVariant()}
            size="sm"
            className={`transition-all duration-200 flex-shrink-0 ${
              joinStatus === "joined"
                ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                : "bg-educonnect-primary hover:bg-educonnect-primary/90 focus:ring-2 focus:ring-educonnect-primary focus:ring-offset-2"
            } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            aria-label={
              joinStatus === "joined"
                ? "Rời khỏi nhóm"
                : joinStatus === "pending"
                  ? "Đang chờ duyệt tham gia nhóm"
                  : "Tham gia nhóm"
            }
            aria-describedby={`group-${group.id}-status`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" aria-hidden="true"></div>
                <span className="hidden sm:inline">{joinStatus === "joined" ? "Đang rời..." : "Đang tham gia..."}</span>
              </div>
            ) : (
              getJoinButtonContent()
            )}
          </Button>

          {/* Hidden status for screen readers */}
          <div id={`group-${group.id}-status`} className="sr-only">
            {joinStatus === "joined" && "Bạn đã là thành viên của nhóm này"}
            {joinStatus === "pending" && "Yêu cầu tham gia đang chờ được duyệt"}
            {joinStatus === "not-joined" && "Bạn chưa tham gia nhóm này"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoized export for performance optimization
export const GroupCard = memo(GroupCardComponent)
