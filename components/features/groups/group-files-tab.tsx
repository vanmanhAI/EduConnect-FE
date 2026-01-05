"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Loader2, FileIcon, ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { EmptyState } from "@/components/ui/empty-state"
import type { Post } from "@/types"

interface GroupFilesTabProps {
  groupId: string
}

interface GroupFile {
  name: string
  url: string
  type: string
  postId: string
  postTitle?: string
  date: Date
  uploader?: {
    name: string
    avatar?: string
  }
}

export function GroupFilesTab({ groupId }: GroupFilesTabProps) {
  const [files, setFiles] = useState<GroupFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true)

        // 1. Fetch group posts
        const postsPromise = api.getGroupPosts(groupId, 1, 50)

        // 2. Fetch group chat messages
        const chatPromise = (async () => {
          try {
            // Get conversation ID for the group
            const conversation = await api.getConversationByGroupId(groupId)
            if (!conversation) return []

            // Get messages
            const messages = await api.getMessages(conversation.id)
            return messages
          } catch (e) {
            console.log("Could not fetch chat files:", e)
            return []
          }
        })()

        const [{ posts }, messages] = await Promise.all([postsPromise, chatPromise])

        const extractedFiles: GroupFile[] = []

        // Extract from Posts
        posts.forEach((post) => {
          const docRegex = /\[(.*?)\]\((.*?)\)/g
          let match

          while ((match = docRegex.exec(post.content)) !== null) {
            const name = match[1]
            const url = match[2]
            const isImage = post.content.charAt(match.index - 1) === "!"

            if (url.includes("/upload/") && !isImage) {
              const extension = name.split(".").pop()?.toUpperCase() || "FILE"
              extractedFiles.push({
                name,
                url,
                type: extension,
                postId: post.id,
                postTitle: post.title,
                date: new Date(post.createdAt),
                uploader: {
                  name: post.author.displayName || post.author.username,
                  avatar: post.author.avatar || undefined,
                },
              })
            }
          }

          if (post.attachments && post.attachments.length > 0) {
            post.attachments.forEach((att: any) => {
              extractedFiles.push({
                name: att.name || "File",
                url: att.url,
                type: att.type || "FILE",
                postId: post.id,
                postTitle: post.title,
                date: new Date(post.createdAt),
                uploader: {
                  name: post.author.displayName || post.author.username,
                  avatar: post.author.avatar || undefined,
                },
              })
            })
          }
        })

        // Extract from Chat Messages
        messages.forEach((msg) => {
          // 1. Markdown logic
          const docRegex = /\[(.*?)\]\((.*?)\)/g
          let match
          while ((match = docRegex.exec(msg.content)) !== null) {
            const name = match[1]
            const url = match[2]
            const isImage = msg.content.charAt(match.index - 1) === "!"

            if (url.includes("/upload/") && !isImage) {
              const extension = name.split(".").pop()?.toUpperCase() || "FILE"
              extractedFiles.push({
                name,
                url,
                type: extension,
                postId: msg.id,
                postTitle: "Tin nhắn nhóm",
                date: new Date(msg.createdAt),
                uploader: {
                  name: msg.sender?.displayName || msg.sender?.username || "Thành viên",
                  avatar: msg.sender?.avatar || undefined,
                },
              })
            }
          }

          // 2. Raw format logic (url|filename)
          if (msg.type === "file" && msg.content.includes("|")) {
            const [url, name] = msg.content.split("|")
            if (url && name && url.includes("/upload/")) {
              const extension = name.split(".").pop()?.toUpperCase() || "FILE"
              // Check uniqueness
              const isDuplicate = extractedFiles.some((f) => f.url === url && f.postId === msg.id)
              if (!isDuplicate) {
                extractedFiles.push({
                  name,
                  url,
                  type: extension,
                  postId: msg.id,
                  postTitle: "Tin nhắn nhóm",
                  date: new Date(msg.createdAt),
                  uploader: {
                    name: msg.sender?.displayName || msg.sender?.username || "Thành viên",
                    avatar: msg.sender?.avatar || undefined,
                  },
                })
              }
            }
          }
        })

        // Sort by date desc
        extractedFiles.sort((a, b) => b.date.getTime() - a.date.getTime())

        setFiles(extractedFiles)
      } catch (error) {
        console.error("Failed to load group files:", error)
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchFiles()
    }
  }, [groupId])

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <EmptyState
        title="Chưa có tệp tin nào"
        description="Các tệp tin được chia sẻ trong bài viết sẽ xuất hiện ở đây"
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file, idx) => (
        <Card key={`${file.postId}-${idx}`} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-educonnect-primary">
                <FileText className="h-5 w-5" />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1" asChild>
                <a href={file.url.replace("/upload/", "/upload/fl_attachment/")} download={file.name}>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate" title={file.name}>
                {file.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {file.type} • {new Date(file.date).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <div className="pt-3 mt-auto border-t flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Đăng bởi <span className="font-medium text-foreground">{file.uploader?.name}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
