"use client"

import { useState } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDate, truncateText, extractTags } from "@/lib/utils"
import { api } from "@/lib/api"
import { tokenManager } from "@/lib/auth"
import type { Post } from "@/types"
import { ImageGrid } from "@/components/ui/image-grid"
import { FileText, Download } from "lucide-react"

const extractDocuments = (markdown: string): { name: string; url: string; type: string }[] => {
  const regex = /\[(.*?)\]\((.*?)\)/g
  const docs = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const name = match[1]
    const url = match[2]
    // Check if it's a file upload (Cloudinary) and NOT an image (which uses ![...])
    if (url.includes("/upload/") && !markdown.substring(match.index - 1, match.index).includes("!")) {
      const extension = name.split(".").pop()?.toUpperCase() || "FILE"
      docs.push({ name, url, type: extension })
    }
  }
  return docs
}

const extractImages = (markdown: string): string[] => {
  const regex = /!\[.*?\]\((.*?)\)/g
  const images = []
  let match
  while ((match = regex.exec(markdown)) !== null) {
    images.push(match[1])
  }
  return images
}

interface PostCardProps {
  post: Post
  showGroup?: boolean
  compact?: boolean
  onPostUpdated?: () => void
  onPostDeleted?: () => void
  onPostUnbookmarked?: (postId: string) => void
  hideActions?: boolean
}

export function PostCard({
  post,
  showGroup = true,
  compact = false,
  onPostUpdated,
  onPostDeleted,
  onPostUnbookmarked,
  hideActions = false,
}: PostCardProps) {
  const { toast } = useToast()
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false)
  const [loading, setLoading] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title)
  const [editContent, setEditContent] = useState(post.content)
  const [editTags, setEditTags] = useState<string[]>(post.tags)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if current user is the author
  const currentUser = tokenManager.getUser()
  const isAuthor = currentUser && String(currentUser.id) === String(post.authorId)

  const handleLike = async () => {
    if (loading) return

    setLoading(true)
    try {
      const result = await api.toggleReaction(post.id, "like", "post")

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

  const handleBookmark = async () => {
    if (bookmarkLoading) return

    setBookmarkLoading(true)
    try {
      if (isBookmarked) {
        // Unbookmark
        await api.unbookmarkPost(post.id)
        setIsBookmarked(false)
        toast({
          title: "Thành công",
          description: "Đã bỏ lưu bài viết",
        })
        // Call callback if provided (for bookmarks page to remove from list)
        if (onPostUnbookmarked) {
          onPostUnbookmarked(post.id)
        }
      } else {
        // Bookmark
        await api.bookmarkPost(post.id)
        setIsBookmarked(true)
        toast({
          title: "Thành công",
          description: "Đã lưu bài viết",
        })
      }
    } catch (error: any) {
      console.error("Failed to toggle bookmark:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái lưu bài viết. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleOpenEdit = () => {
    setEditTitle(post.title)
    setEditContent(post.content)
    // Ensure tags are strings
    const stringTags = post.tags.map((tag) => (typeof tag === "string" ? tag : (tag as any).name)).filter(Boolean)
    setEditTags(stringTags)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và nội dung bài viết",
      })
      return
    }

    try {
      setIsSaving(true)
      const extractedTags = extractTags(editContent)
      await api.updatePost(post.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: extractedTags,
      })

      toast({
        title: "Thành công",
        description: "Bài viết đã được cập nhật",
      })

      setIsEditDialogOpen(false)

      // Call callback if provided, otherwise reload page
      if (onPostUpdated) {
        onPostUpdated()
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error("Failed to update post:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật bài viết. Vui lòng thử lại.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePost = async () => {
    try {
      setIsDeleting(true)
      await api.deletePost(post.id)

      toast({
        title: "Thành công",
        description: "Bài viết đã được xóa",
      })

      setIsDeleteDialogOpen(false)

      // If callback provided, use it
      if (onPostDeleted) {
        onPostDeleted()
      } else if (window.location.pathname.includes(`/posts/${post.id}`)) {
        // If on post detail page, redirect to feed
        window.location.href = "/feed"
      } else {
        // Otherwise reload to update the list
        window.location.reload()
      }
    } catch (error: any) {
      console.error("Failed to delete post:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xóa bài viết. Vui lòng thử lại.",
      })
      setIsDeleting(false)
    }
  }

  const documents = extractDocuments(post.content)

  let cleanContent = post.content
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/#[\w]+/g, "") // remove hashtags

  // Remove extracted documents
  documents.forEach((doc) => {
    const linkRegex = new RegExp(`\\[${doc.name}\\]\\(${doc.url}\\)`, "g")
    cleanContent = cleanContent.replace(linkRegex, "")
  })

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <AvatarWithStatus
              src={post.author.avatar}
              fallback={post.author.displayName?.charAt(0) || post.author.username?.charAt(0) || "?"}
              alt={post.author.displayName || post.author.username || "Author"}
              isOnline={post.author.isOnline}
              showStatus={post.author.profileVisibility === "public"}
              className="h-10 w-10"
            />
            <div>
              <div className="flex flex-wrap items-center gap-x-2">
                <Link href={`/profile/${post.author.id}`} className="font-medium hover:underline whitespace-nowrap">
                  {post.author.displayName || post.author.username || "Unknown User"}
                </Link>
                {showGroup && post.group && (
                  <div className="flex items-center gap-1 basis-full sm:basis-auto text-sm">
                    <span className="text-muted-foreground">trong</span>
                    <Link
                      href={`/groups/${post.group.id}`}
                      className="text-educonnect-primary hover:underline font-medium"
                    >
                      {post.group.name}
                    </Link>
                  </div>
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
              {isAuthor && (
                <>
                  <DropdownMenuItem onClick={handleOpenEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa bài viết
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleBookmark} disabled={bookmarkLoading}>
                <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                {bookmarkLoading ? "Đang xử lý..." : isBookmarked ? "Bỏ lưu bài viết" : "Lưu bài viết"}
              </DropdownMenuItem>
              <DropdownMenuItem>Báo cáo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Link href={`/posts/${post.id}`}>
            <h3 className="text-lg font-semibold hover:text-educonnect-primary transition-colors mb-2 whitespace-normal break-normal">
              {post.title}
            </h3>
          </Link>

          <div className={`prose prose-base max-w-none text-foreground break-words ${compact ? "line-clamp-4" : ""}`}>
            <ReactMarkdown
              components={{
                code(props: any) {
                  const { children, className, node, ...rest } = props
                  const match = /language-(\w+)/.exec(className || "")
                  return match ? (
                    <code
                      className={`${className} bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5`}
                      {...rest}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className={`${className} bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5`}
                      {...rest}
                    >
                      {children}
                    </code>
                  )
                },
                pre(props: any) {
                  const { children, ...rest } = props
                  return (
                    <pre
                      className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md p-4 overflow-x-auto"
                      {...rest}
                    >
                      {children}
                    </pre>
                  )
                },
              }}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>

          {documents.length > 0 && (
            <div className="mt-3 grid gap-2">
              {documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url.replace("/upload/", "/upload/fl_attachment/")}
                  download={doc.name}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors group no-underline"
                >
                  <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center shadow-sm text-educonnect-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground group-hover:text-educonnect-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground group-hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              ))}
            </div>
          )}

          <ImageGrid images={extractImages(post.content)} />

          {compact && (
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
            {post.tags.map((tag) => {
              // Handle both string and object formats
              const tagName = typeof tag === "string" ? tag : (tag as any).name
              const tagKey = typeof tag === "string" ? tag : (tag as any).id
              return (
                <Badge key={tagKey} variant="secondary" className="text-xs">
                  {tagName}
                </Badge>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            {!hideActions && (
              <>
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
              </>
            )}

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="mr-1 h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tiêu đề</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nội dung</label>
              <Textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value)
                  setEditTags(extractTags(e.target.value))
                }}
                placeholder="Nhập nội dung bài viết..."
                className="min-h-[300px] resize-none"
              />
              <p className="text-xs text-muted-foreground">Sử dụng # để thêm hashtag (ví dụ: #javascript #react)</p>
            </div>

            {editTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Thẻ được tìm thấy:</label>
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag) => {
                    // Handle both string and object formats
                    const tagName = typeof tag === "string" ? tag : (tag as any).name
                    const tagKey = typeof tag === "string" ? tag : (tag as any).id
                    return (
                      <Badge key={tagKey} variant="secondary" className="text-xs">
                        {tagName}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa bài viết"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
