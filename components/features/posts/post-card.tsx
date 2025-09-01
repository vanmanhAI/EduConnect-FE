"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate, truncateText } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Post } from "@/types"

interface PostCardProps {
  post: Post
  showGroup?: boolean
  compact?: boolean
}

export function PostCard({ post, showGroup = true, compact = false }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (loading) return

    setLoading(true)
    try {
      if (isLiked) {
        await api.unlikePost(post.id)
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      } else {
        await api.likePost(post.id)
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          url: `/posts/${post.id}`,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
              <AvatarFallback>{post.author.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <Link href={`/profile/${post.author.id}`} className="font-medium hover:underline">
                  {post.author.displayName}
                </Link>
                {showGroup && post.group && (
                  <>
                    <span className="text-muted-foreground">trong</span>
                    <Link
                      href={`/groups/${post.group.id}`}
                      className="text-educonnect-primary hover:underline font-medium"
                    >
                      {post.group.name}
                    </Link>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Bookmark className="mr-2 h-4 w-4" />
                Lưu bài viết
              </DropdownMenuItem>
              <DropdownMenuItem>Báo cáo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Link href={`/posts/${post.id}`}>
            <h3 className="text-lg font-semibold hover:text-educonnect-primary transition-colors mb-2">{post.title}</h3>
          </Link>

          <div className="prose prose-sm max-w-none text-muted-foreground">
            {compact ? truncateText(post.content, 200) : post.content}
          </div>

          {compact && post.content.length > 200 && (
            <Link
              href={`/posts/${post.id}`}
              className="text-educonnect-primary hover:underline text-sm mt-2 inline-block"
            >
              Đọc thêm
            </Link>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={loading}
              className={isLiked ? "text-red-500 hover:text-red-600" : ""}
            >
              <Heart className={`mr-1 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link href={`/posts/${post.id}#comments`}>
                <MessageCircle className="mr-1 h-4 w-4" />
                {post.commentCount}
              </Link>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="mr-1 h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
