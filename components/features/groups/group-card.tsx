"use client"

import { useState } from "react"
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

export function GroupCard({ group }: GroupCardProps) {
  const [joinStatus, setJoinStatus] = useState(group.joinStatus || "not-joined")
  const [memberCount, setMemberCount] = useState(group.memberCount)
  const [loading, setLoading] = useState(false)

  const handleJoinToggle = async () => {
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
  }

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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {group.coverImage && (
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
            <img src={group.coverImage || "/placeholder.svg"} alt={group.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={group.avatar || "/placeholder.svg"} />
              <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/groups/${group.id}`}
                  className="font-semibold text-lg hover:text-educonnect-primary transition-colors"
                >
                  {group.name}
                </Link>
                {group.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{formatNumber(memberCount)} thành viên</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm leading-relaxed">{group.description}</p>

        {/* Tags */}
        {group.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Tạo {new Date(group.createdAt).toLocaleDateString("vi-VN")}
          </div>

          <Button
            onClick={handleJoinToggle}
            disabled={loading}
            variant={getJoinButtonVariant()}
            size="sm"
            className={joinStatus === "joined" ? "" : "bg-educonnect-primary hover:bg-educonnect-primary/90"}
          >
            {getJoinButtonContent()}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
