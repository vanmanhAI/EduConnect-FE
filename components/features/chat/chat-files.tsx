"use client"

import { useState, useEffect } from "react"
import { FileText, Download, Loader2, ChevronRight, File } from "lucide-react"
import { api } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

interface ChatFilesProps {
  threadId: string
  isOpen?: boolean
  onToggle?: () => void
}

interface ChatFile {
  id: string
  name: string
  url: string
  type: string
  date: Date
  senderName: string
}

export function ChatFiles({ threadId, isOpen, onToggle }: ChatFilesProps) {
  const [files, setFiles] = useState<ChatFile[]>([])
  const [loading, setLoading] = useState(false)

  // Load files when expanded
  useEffect(() => {
    if (isOpen) {
      const fetchFiles = async () => {
        try {
          setLoading(true)
          const messages = await api.getMessages(threadId)

          const extractedFiles: ChatFile[] = []

          messages.forEach((msg) => {
            // 1. Markdown logic
            const docRegex = /\[(.*?)\]\((.*?)\)/g
            let match
            while ((match = docRegex.exec(msg.content)) !== null) {
              const name = match[1]
              const url = match[2]
              const isImage = msg.content.charAt(match.index - 1) === "!"

              if (url.includes("/upload/") && !isImage) {
                extractedFiles.push({
                  id: msg.id,
                  name,
                  url,
                  type: name.split(".").pop()?.toUpperCase() || "FILE",
                  date: new Date(msg.createdAt),
                  senderName: msg.sender?.displayName || msg.sender?.username || "Unknown",
                })
              }
            }

            // 2. Raw format logic (url|filename)
            if (msg.type === "file" && msg.content.includes("|")) {
              const [url, name] = msg.content.split("|")
              if (url && name && url.includes("/upload/")) {
                // Check validation to prevent dupes if regex also caught it (unlikely for "file" type but safe)
                const isDuplicate = extractedFiles.some((f) => f.id === msg.id && f.url === url)
                if (!isDuplicate) {
                  extractedFiles.push({
                    id: msg.id,
                    name,
                    url,
                    type: name.split(".").pop()?.toUpperCase() || "FILE",
                    date: new Date(msg.createdAt),
                    senderName: msg.sender?.displayName || msg.sender?.username || "Unknown",
                  })
                }
              }
            }
          })

          // Sort recent first
          extractedFiles.sort((a, b) => b.date.getTime() - a.date.getTime())
          setFiles(extractedFiles)
        } catch (err) {
          console.error("Failed to load chat files", err)
        } finally {
          setLoading(false)
        }
      }

      fetchFiles()
    }
  }, [isOpen, threadId])

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-medium h-12">
          <span>File phương tiện & file</span>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 m-2 rounded-md">
            Không có file nào
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] overflow-y-auto">
            <div className="space-y-1 p-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.url.replace("/upload/", "/upload/fl_attachment/")}
                  download={file.name}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors group"
                >
                  <div className="flex-shrink-0 h-8 w-8 bg-muted-foreground/10 rounded flex items-center justify-center text-primary">
                    <File className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {file.senderName} • {new Date(file.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </ScrollArea>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
