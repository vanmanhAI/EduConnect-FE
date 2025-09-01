"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { api } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Send, Heart, MessageCircle } from "lucide-react"
import type { Post, Comment } from "@/types"

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPost()
    loadComments()
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      const data = await api.getPost(postId)
      setPost(data)
    } catch (err) {
      setError("Không thể tải bài viết")
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const data = await api.getComments(postId)
      setComments(data)
    } catch (err) {
      console.error("Failed to load comments:", err)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      await api.createComment(postId, newComment.trim())
      setNewComment("")
      loadComments()
    } catch (err) {
      console.error("Failed to add comment:", err)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto p-6">
          <LoadingSkeleton className="h-96 mb-6" />
          <LoadingSkeleton className="h-32" />
        </div>
      </AppShell>
    )
  }

  if (error || !post) {
    return (
      <AppShell>
        <ErrorState title="Không thể tải bài viết" description={error || "Bài viết không tồn tại"} onRetry={loadPost} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto p-6">
        {/* Post */}
        <PostCard post={post} />

        {/* Comments Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Bình luận ({comments.length})</h3>

          {/* Add Comment */}
          <div className="mb-6">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Gửi bình luận
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                  <AvatarFallback>{comment.authorId.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Người dùng</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      Thích ({comment.likeCount})
                    </Button>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Trả lời
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
