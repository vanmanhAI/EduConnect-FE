"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, X } from "lucide-react"
import { ChatMessage } from "@/types"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  onTyping: (isTyping: boolean) => void
  onFileSelect: (file: File) => void
  replyTo: ChatMessage | null
  onCancelReply: () => void
  disabled?: boolean
  uploadProgress?: number
}

export const ChatInput = ({
  onSendMessage,
  onTyping,
  onFileSelect,
  replyTo,
  onCancelReply,
  disabled = false,
  uploadProgress,
}: ChatInputProps) => {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMessage(value)

    // Typing indicator logic
    if (!isTyping) {
      setIsTyping(true)
      onTyping(true)
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
      setIsTyping(false)
      typingTimeoutRef.current = null
    }, 2000)
  }

  const handleSend = () => {
    if (!message.trim()) return
    onSendMessage(message.trim())
    setMessage("")

    // Reset typing immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    onTyping(false)
    setIsTyping(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // Reset input so same file can be selected again
      e.target.value = ""
    }
  }

  return (
    <div className="sticky bottom-0 z-10 p-3 sm:p-4 border-t border-border flex-shrink-0 backdrop-blur-sm bg-card/95 min-w-0">
      {/* Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 bg-muted/50 rounded-lg border-l-4 border-primary">
          <div className="flex flex-col text-sm overflow-hidden min-w-0 mr-2">
            <span className="font-semibold text-primary truncate text-xs">
              Đang trả lời {replyTo.sender?.displayName || "Người dùng"}
            </span>
            <span className="text-muted-foreground truncate text-xs opacity-90">{replyTo.content}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/80 rounded-full flex-shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Progress Bar for Upload */}
      {uploadProgress !== undefined && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="flex items-end gap-2 sm:gap-3 min-w-0">
        <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="*/*" />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 sm:h-9 sm:w-9 p-0 flex-shrink-0 text-primary hover:bg-primary/10 rounded-full"
          disabled={disabled || uploadProgress !== undefined}
        >
          <Paperclip className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>

        <div className="flex-1 relative min-w-0">
          <Input
            placeholder="Nhập tin nhắn..."
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled || uploadProgress !== undefined}
            className="pr-10 sm:pr-12 h-10 sm:h-9 text-[16px] sm:text-sm rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 px-4"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || uploadProgress !== undefined}
          size="icon"
          className="h-10 w-10 sm:h-9 sm:w-9 p-0 flex-shrink-0 rounded-full shadow-none"
        >
          <Send className="h-5 w-5 sm:h-4 sm:w-4 ml-0.5" />
        </Button>
      </div>
    </div>
  )
}
