"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { CommentItem } from "@/components/features/posts/comment-item"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { tokenManager } from "@/lib/auth"
import { Send, Loader2 } from "lucide-react"
import type { Post, Comment } from "@/types"

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  const { toast } = useToast()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentsPage, setCommentsPage] = useState(1)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const currentUser = tokenManager.getUser()

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

  const loadComments = async (page: number = 1) => {
    try {
      const { comments: data, hasMore } = await api.getComments(postId, page, 10)

      if (page === 1) {
        setComments(data)
      } else {
        setComments((prev) => [...prev, ...data])
      }

      setHasMoreComments(hasMore)
      setCommentsPage(page)
    } catch (err) {
      console.error("Failed to load comments:", err)
      toast({
        title: "Lỗi",
        description: "Không thể tải bình luận",
        variant: "destructive",
      })
    }
  }

  const handleLoadMoreComments = useCallback(async () => {
    if (loadingMoreComments || !hasMoreComments) return

    setLoadingMoreComments(true)
    try {
      await loadComments(commentsPage + 1)
    } finally {
      setLoadingMoreComments(false)
    }
  }, [loadingMoreComments, hasMoreComments, commentsPage])

  // Infinite scroll observer for comments
  useEffect(() => {
    if (loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreComments && !loadingMoreComments) {
          handleLoadMoreComments()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [loading, hasMoreComments, loadingMoreComments, handleLoadMoreComments])

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung bình luận",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await api.createComment(postId, newComment.trim())
      setNewComment("")

      toast({
        title: "Thành công",
        description: "Đã thêm bình luận",
      })

      loadComments()
    } catch (err) {
      console.error("Failed to add comment:", err)
      toast({
        title: "Lỗi",
        description: "Không thể thêm bình luận. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
                <AvatarImage src={currentUser?.avatar || "/placeholder-user.jpg"} />
                <AvatarFallback>
                  {currentUser?.displayName?.charAt(0) || currentUser?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Viết bình luận..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-2">
                  <Button onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có bình luận nào</p>
            ) : (
              <>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={postId}
                    onCommentAdded={() => loadComments(1)}
                  />
                ))}

                {/* Infinite Scroll Trigger */}
                {(hasMoreComments || loadingMoreComments) && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    {loadingMoreComments ? (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Đang tải thêm bình luận...</span>
                      </div>
                    ) : (
                      <div className="h-4" /> /* Invisible trigger target */
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
