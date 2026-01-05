"use client"

import React, { useState, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import { Reply, MoreVertical, Trash2, Edit2, Copy, FileText, Download, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types"

interface ChatMessageItemProps {
  message: ChatMessage
  isCurrentUser: boolean
  isMobile: boolean
  showAvatar?: boolean // New prop
  isGrouped?: boolean // Explicit grouping control
  isGroupChat?: boolean // New prop
  onReply: (message: ChatMessage) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string) => void
}

export const ChatMessageItem = ({
  message,
  isCurrentUser,
  isMobile,
  showAvatar = true, // Default true
  isGrouped = false,
  isGroupChat = false,
  onReply,
  onDelete,
  onEdit,
}: ChatMessageItemProps) => {
  const [swipeTranslation, setSwipeTranslation] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [showLongPressMenu, setShowLongPressMenu] = useState(false)

  // Swipe handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    touchStartX.current = e.targetTouches[0].clientX

    // Long press detection
    longPressTimer.current = setTimeout(() => {
      setShowLongPressMenu(true)
      // Vibrate if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms for long press
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || touchStartX.current === null) return

    const currentX = e.targetTouches[0].clientX
    const diff = currentX - touchStartX.current

    // Detect swiping
    if (Math.abs(diff) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    // Logic for swipe direction:
    // Current User (Right aligned): Swipe Left (diff < 0)
    // Other User (Left aligned): Swipe Right (diff > 0)
    const isValidSwipe = isCurrentUser ? diff < 0 : diff > 0

    if (isValidSwipe && Math.abs(diff) < 100) {
      setSwipeTranslation(Math.abs(diff))
      setIsSwiping(true)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!isMobile) return

    if (swipeTranslation > 50) {
      // Trigger reply
      onReply(message)
    }

    // Reset
    setSwipeTranslation(0)
    setIsSwiping(false)
    touchStartX.current = null
  }

  // Double tap handler (alternative to swipe)
  const handleDoubleClick = () => {
    if (isMobile) {
      onReply(message)
    }
  }

  // Render Reply Preview (Messenger Style)
  const renderReplyPreview = () => {
    if (!message.replyTo) return null

    return (
      <div
        className={cn(
          "text-xs mb-1 flex items-end relative z-0", // z-0 to stay behind bubble if needed
          isCurrentUser ? "flex-row-reverse mr-4" : "flex-row ml-12" // Offset for connector
        )}
      >
        {/* Connector Line */}
        <div
          className={cn(
            "w-8 h-4 border-t-2 border-muted-foreground/30 absolute bottom-[-4px]",
            isCurrentUser
              ? "right-4 border-r-2 rounded-tr-xl" // Right side connector
              : "left-[-1.5rem] border-l-2 rounded-tl-xl" // Left side connector
            // Adjust positioning relative to bubble
          )}
          style={{
            // Custom adjustments for perfect alignment
            width: "12px",
            height: "12px",
            marginBottom: "-2px",
          }}
        />

        <div
          className={cn(
            "bg-muted/50 rounded-2xl px-3 py-2 max-w-[200px] truncate text-muted-foreground opacity-90 text-xs", // text-[11px] -> text-xs
            isCurrentUser ? "mr-1" : "ml-1"
          )}
        >
          <span className="font-bold block mb-0.5 text-primary/80">
            {message.replyTo.sender?.displayName || "Người dùng"}
          </span>
          <span className="truncate block opacity-90">{message.replyTo.content}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col mb-1",
        isCurrentUser ? "items-end" : "items-start",
        message.replyTo && "mt-2" // Add extra spacing for replies
      )}
    >
      {/* Render Reply Content */}
      {renderReplyPreview()}

      <div
        className="relative flex items-end max-w-[85%] sm:max-w-[70%] z-10" // z-10 to sit above connector if overlap
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: `translateX(${isCurrentUser ? -swipeTranslation : swipeTranslation}px)`,
          transition: isSwiping ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* Swipe Indicator Icon */}
        {isSwiping && (
          <div
            className={cn(
              "absolute flex items-center justify-center w-8 h-full top-0",
              isCurrentUser ? "right-full mr-2" : "left-full ml-2"
            )}
          >
            <Reply className="h-5 w-5 text-primary animate-pulse" />
          </div>
        )}

        {/* Avatar for non-current user */}
        {!isCurrentUser && (
          <div className={cn("mr-2 flex-shrink-0 w-8", showAvatar ? "" : "invisible")}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender?.avatar || undefined} />
              <AvatarFallback>{message.sender?.displayName?.[0] || "?"}</AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "relative break-words",
            // Text messages get bubble styling
            !["image", "video", "file"].includes(message.type) &&
              cn(
                "px-4 py-2 text-[15px] shadow-sm",
                isCurrentUser
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                  : "bg-muted text-foreground rounded-2xl rounded-tl-sm",
                isGrouped && isCurrentUser && "rounded-tr-2xl mr-0",
                isGrouped && !isCurrentUser && "rounded-tl-2xl ml-0"
              ),
            // Media/Files get no parent padding/bg
            ["image", "video", "file"].includes(message.type) && "p-0 bg-transparent shadow-none"
          )}
        >
          {/* Sender Name in Group Chat (only first message of block) */}
          {!isCurrentUser &&
            !isGrouped &&
            showAvatar &&
            isGroupChat &&
            !["image", "video", "file"].includes(message.type) && (
              <div className="text-xs font-bold opacity-70 mb-1 text-primary">{message.sender?.displayName}</div>
            )}

          {message.content && !["image", "video", "file"].includes(message.type) && (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}

          {message.type === "image" && (
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative rounded-2xl overflow-hidden my-0.5 shadow-sm group/image cursor-pointer active:scale-95 transition-transform duration-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.content}
                    alt="Attachment"
                    className="max-w-[260px] max-h-[360px] w-auto h-auto object-cover hover:opacity-95 transition-opacity"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="!max-w-none w-screen h-screen p-0 bg-black/95 border-none shadow-none flex flex-col items-center justify-center overflow-hidden z-[100] focus:outline-none">
                <DialogTitle className="sr-only">Hình ảnh đính kèm</DialogTitle>

                {/* Close Button */}
                <DialogClose className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white/80 hover:text-white rounded-full backdrop-blur-sm transition-colors cursor-pointer outline-none">
                  <X className="h-6 w-6" />
                </DialogClose>

                {/* Main Image */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.content}
                    alt="Full size"
                    className="max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-200"
                  />
                </div>

                {/* Download Button */}
                <a
                  href={message.content.replace("/upload/", "/upload/fl_attachment/")}
                  className="absolute bottom-8 right-8 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/10"
                  title="Tải về"
                  download
                >
                  <Download className="h-6 w-6" />
                </a>
              </DialogContent>
            </Dialog>
          )}

          {message.type === "video" && (
            <div className="relative rounded-2xl overflow-hidden my-0.5 max-w-[260px] shadow-sm bg-black">
              <video controls className="w-full max-h-[360px]">
                <source src={message.content} />
                Trình duyệt không hỗ trợ video.
              </video>
            </div>
          )}

          {message.type === "file" && (
            <a
              href={message.content.split("|")[0].replace("/upload/", "/upload/fl_attachment/")}
              download={message.content.split("|")[1] || "download"}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl max-w-[280px] cursor-pointer transition-all border shadow-sm group/file active:scale-95 no-underline",
                isCurrentUser
                  ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted border-transparent text-foreground hover:bg-muted/80"
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                  isCurrentUser ? "bg-primary-foreground/20" : "bg-background"
                )}
              >
                <FileText className={cn("h-5 w-5", isCurrentUser ? "text-primary-foreground" : "text-primary")} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className={cn(
                    "text-[13px] font-semibold truncate leading-tight",
                    isCurrentUser ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {message.content.split("|")[1] || message.content.split("/").pop() || "File đính kèm"}
                </p>
                <p
                  className={cn(
                    "text-[11px] truncate mt-0.5",
                    isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {message.content.split(".").pop()?.toUpperCase() || "FILE"}
                </p>
              </div>
              <Download
                className={cn(
                  "h-4 w-4 transition-opacity",
                  isCurrentUser
                    ? "text-primary-foreground/70 group-hover/file:text-primary-foreground"
                    : "text-muted-foreground group-hover/file:text-foreground"
                )}
              />
            </a>
          )}
        </div>

        {/* Desktop Actions (Hover) */}
        <div
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1",
            isCurrentUser ? "right-full mr-2" : "left-full ml-2"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted bg-background/80 shadow-sm border"
            onClick={() => onReply(message)}
          >
            <Reply className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted bg-background/80 shadow-sm border"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                <Copy className="h-4 w-4 mr-2" /> Sao chép
              </DropdownMenuItem>
              {isCurrentUser && (
                <>
                  <DropdownMenuItem disabled>
                    <Edit2 className="h-4 w-4 mr-2" /> Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" disabled>
                    <Trash2 className="h-4 w-4 mr-2" /> Xóa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Long Press Menu (Hidden Trigger) */}
      <DropdownMenu open={showLongPressMenu} onOpenChange={setShowLongPressMenu}>
        <DropdownMenuTrigger className="hidden" />
        <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
          <DropdownMenuItem onClick={() => onReply(message)}>
            <Reply className="h-4 w-4 mr-2" /> Trả lời
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
            <Copy className="h-4 w-4 mr-2" /> Sao chép
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
