"use client"

import { useState } from "react"
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
import { useToast } from "@/hooks/use-toast"
import { Comment } from "@/types"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { LoginPromptDialog } from "@/components/auth/login-prompt-dialog"
import { tokenManager } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface CommentItemProps {
  comment: Comment
  postId: string
  onCommentAdded?: () => void
}

export function CommentItem({ comment, postId, onCommentAdded }: CommentItemProps) {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLiked, setIsLiked] = useState(comment.isLiked || false)
  const [likeCount, setLikeCount] = useState(comment.likeCount)
  const [isLiking, setIsLiking] = useState(false)

  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptAction, setLoginPromptAction] = useState<"like" | "reply">("like")

  // Check if current user is the author
  const isAuthor = currentUser && String(currentUser.id) === String(comment.authorId)

  const handleLike = async () => {
    if (!currentUser) {
      setLoginPromptAction("like")
      setShowLoginPrompt(true)
      return
    }

    if (isLiking) return

    setIsLiking(true)
    try {
      const result = await api.toggleReaction(comment.id, "like", "comment")

      if (result.action === "added") {
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      } else {
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      }

      // If backend returns the exact count, use it
      if (result.likeCount !== undefined) {
        setLikeCount(result.likeCount)
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật reaction. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung bình luận",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await api.createComment(postId, replyContent.trim(), comment.id)

      toast({
        title: "Thành công",
        description: "Đã trả lời bình luận",
      })

      setReplyContent("")
      setIsReplying(false)

      // Trigger reload comments
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("Failed to reply to comment:", error)
      toast({
        title: "Lỗi",
        description: "Không thể gửi trả lời. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung bình luận",
        variant: "destructive",
      })
      return
    }

    if (editContent.trim() === comment.content) {
      setIsEditing(false)
      return
    }

    setIsSubmitting(true)
    try {
      await api.updateComment(comment.id, editContent.trim())

      toast({
        title: "Thành công",
        description: "Đã cập nhật bình luận",
      })

      setIsEditing(false)

      // Trigger reload comments
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("Failed to update comment:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật bình luận. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.deleteComment(comment.id)

      toast({
        title: "Thành công",
        description: "Đã xóa bình luận",
      })

      // Trigger reload comments
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("Failed to delete comment:", error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa bình luận. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi })
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatar || "/placeholder-user.jpg"} />
          <AvatarFallback>
            {comment.author.displayName?.charAt(0) || comment.author.username?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                disabled={isSubmitting}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button size="sm" onClick={handleEdit} disabled={isSubmitting || !editContent.trim()}>
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>
          ) : (
            /* Comment Display */
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{comment.author.displayName || comment.author.username}</p>
                  {comment.replyToUser && (
                    <p className="text-xs text-muted-foreground">
                      Trả lời{" "}
                      <span className="font-medium">
                        {comment.replyToUser.displayName || comment.replyToUser.username}
                      </span>
                    </p>
                  )}
                </div>
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-3 w-3" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
              {comment.updatedAt && comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
                <p className="text-xs text-muted-foreground mt-1">(Đã chỉnh sửa)</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <button
              className={`hover:text-foreground transition-colors flex items-center gap-1 ${
                isLiked ? "text-red-500 font-medium" : ""
              }`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-3 w-3 ${isLiked ? "fill-current" : ""}`} />
              <span>{likeCount > 0 ? likeCount : "Thích"}</span>
            </button>
            <button
              className="hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => {
                if (!currentUser) {
                  setLoginPromptAction("reply")
                  setShowLoginPrompt(true)
                  return
                }
                setIsReplying(!isReplying)
              }}
            >
              <MessageCircle className="h-3 w-3" />
              <span>Trả lời</span>
            </button>
            <span>{formatDate(comment.createdAt)}</span>
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder={`Trả lời ${comment.author.displayName || comment.author.username}...`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent("")
                  }}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button size="sm" onClick={handleReply} disabled={isSubmitting || !replyContent.trim()}>
                  {isSubmitting ? "Đang gửi..." : "Gửi"}
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs h-auto py-1 px-2"
              >
                {showReplies ? "Ẩn" : "Xem"} {comment.replies.length} phản hồi
              </Button>

              {showReplies && (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} postId={postId} onCommentAdded={onCommentAdded} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive">
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoginPromptDialog
        open={showLoginPrompt}
        onOpenChange={setShowLoginPrompt}
        title={loginPromptAction === "like" ? "Đăng nhập để thích" : "Đăng nhập để trả lời"}
        description={
          loginPromptAction === "like"
            ? "Bạn cần đăng nhập để thích bình luận này."
            : "Bạn cần đăng nhập để trả lời bình luận này."
        }
      />
    </div>
  )
}
