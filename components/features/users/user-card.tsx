"use client"

import { useState } from "react"
import Link from "next/link"
import { UserPlus, UserCheck, MoreVertical, UserMinus, LogOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatNumber } from "@/lib/utils"
import { api } from "@/lib/api"
import { tokenManager } from "@/lib/auth"
import type { User } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { LoginPromptDialog } from "@/components/auth/login-prompt-dialog"

interface UserCardProps {
  user: User
  showFollowButton?: boolean
  isGroupOwner?: boolean
  groupId?: string
  isBanned?: boolean
  onMemberKicked?: () => void
  onMemberLeft?: () => void
  onMemberBanned?: () => void
  onMemberUnbanned?: () => void
}

export function UserCard({
  user,
  showFollowButton = true,
  isGroupOwner = false,

  groupId,
  isBanned = false,
  onMemberKicked,
  onMemberLeft,
  onMemberBanned,
  onMemberUnbanned,
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
  const [followerCount, setFollowerCount] = useState(user.followers || user.followersCount || 0)
  const [loading, setLoading] = useState(false)
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false)
  const [isKicking, setIsKicking] = useState(false)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isBanning, setIsBanning] = useState(false)
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false)
  const [isUnbanning, setIsUnbanning] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // Check if this card is for the current user
  const { user: currentUser } = useAuth()
  const isCurrentUser = currentUser && currentUser.id === user.id
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleFollowToggle = async () => {
    if (!currentUser) {
      setShowLoginPrompt(true)
      return
    }

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

  const handleBanMember = async () => {
    if (!groupId || isBanning) return

    setIsBanning(true)
    try {
      await api.banGroupMember(groupId, user.id)
      setIsBanDialogOpen(false)
      onMemberBanned?.()
    } catch (error: any) {
      console.error("Failed to ban member:", error)
      alert(error.message || "Không thể ban thành viên")
    } finally {
      setIsBanning(false)
    }
  }

  const handleUnbanMember = async () => {
    if (!groupId || isUnbanning) return

    setIsUnbanning(true)
    try {
      await api.unbanGroupMember(groupId, user.id)
      setIsUnbanDialogOpen(false)
      onMemberUnbanned?.()
    } catch (error: any) {
      console.error("Failed to unban member:", error)
      alert(error.message || "Không thể unban thành viên")
    } finally {
      setIsUnbanning(false)
    }
  }

  const handleKickMember = async () => {
    if (!groupId || isKicking) return

    setIsKicking(true)
    try {
      await api.kickGroupMember(groupId, user.id)
      setIsKickDialogOpen(false)
      onMemberKicked?.()
    } catch (error: any) {
      console.error("Failed to kick member:", error)
      alert(error.message || "Không thể kick thành viên khỏi nhóm")
    } finally {
      setIsKicking(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!groupId || isLeaving) return

    setIsLeaving(true)
    try {
      await api.leaveGroup(groupId)
      setIsLeaveDialogOpen(false)
      onMemberLeft?.()
    } catch (error: any) {
      console.error("Failed to leave group:", error)
      alert(error.message || "Không thể rời khỏi nhóm")
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <>
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

            <div className="flex items-center gap-2">
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

              {/* Show dropdown menu if user is group owner OR if this is current user's card */}
              {groupId && (isGroupOwner || isCurrentUser) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isCurrentUser ? (
                      // Show "Leave Group" option for current user
                      <DropdownMenuItem
                        onClick={() => setIsLeaveDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Rời nhóm
                      </DropdownMenuItem>
                    ) : (
                      // Show "Kick" and "Ban" option for group owner (only if not current user)
                      isGroupOwner && (
                        <>
                          {isBanned ? (
                            <DropdownMenuItem
                              onClick={() => setIsUnbanDialogOpen(true)}
                              className="text-primary focus:text-primary"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Gỡ cấm
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() => setIsKickDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Kick khỏi nhóm
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setIsBanDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                              >
                                <LogOut className="mr-2 h-4 w-4" />
                                Ban thành viên
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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

      {/* Kick Confirmation Dialog */}
      <AlertDialog open={isKickDialogOpen} onOpenChange={setIsKickDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick thành viên khỏi nhóm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kick <strong>{user.displayName || user.username}</strong> khỏi nhóm? Thành viên này
              sẽ không còn quyền truy cập vào nhóm nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isKicking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKickMember}
              disabled={isKicking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isKicking ? "Đang xử lý..." : "Kick"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation Dialog */}
      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rời khỏi nhóm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn rời khỏi nhóm này? Bạn sẽ không còn quyền truy cập vào nội dung của nhóm nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLeaving ? "Đang xử lý..." : "Rời nhóm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoginPromptDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        title="Đăng nhập để theo dõi"
        description="Bạn cần đăng nhập để theo dõi người dùng này."
      />

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban thành viên khỏi nhóm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn cấm <strong>{user.displayName || user.username}</strong> khỏi nhóm? Thành viên này
              sẽ bị loại khỏi nhóm và không thể tham gia lại cho đến khi được gỡ cấm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBanning}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanMember}
              disabled={isBanning}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isBanning ? "Đang xử lý..." : "Cấm thành viên"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unban Confirmation Dialog */}
      <AlertDialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ cấm thành viên?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn gỡ cấm cho <strong>{user.displayName || user.username}</strong>? Người này sẽ có thể
              tham gia lại nhóm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnbanning}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnbanMember}
              disabled={isUnbanning}
              className="bg-primary hover:bg-primary/90"
            >
              {isUnbanning ? "Đang xử lý..." : "Gỡ cấm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
