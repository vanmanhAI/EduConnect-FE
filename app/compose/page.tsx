"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { Save, Send, Hash, ImageIcon, Code, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppShell } from "@/components/layout/app-shell"
import { api } from "@/lib/api"
import { extractTags } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useFileUpload } from "@/hooks/use-file-upload"
import type { Group } from "@/types"

import { AuthGuard } from "@/components/auth/auth-guard"

const DRAFT_TITLE = "educonnect_draft_title"
const DRAFT_CONTENT = "educonnect_draft_content"
const DRAFT_GROUP = "educonnect_draft_group"

export default function ComposePage() {
  return (
    <AuthGuard>
      <ComposePageContent />
    </AuthGuard>
  )
}

function ComposePageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get("group")

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || "public")
  const [tags, setTags] = useState<string[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Custom hook for file upload
  const { upload, isUploading, progress } = useFileUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load draft from localStorage
  useEffect(() => {
    const savedTitle = localStorage.getItem(DRAFT_TITLE)
    const savedContent = localStorage.getItem(DRAFT_CONTENT)
    const savedGroup = localStorage.getItem(DRAFT_GROUP)

    if (savedTitle) setTitle(savedTitle)
    if (savedContent) setContent(savedContent)
    if (savedGroup) setSelectedGroupId(savedGroup)
  }, [])

  // Auto-save draft to localStorage
  useEffect(() => {
    localStorage.setItem(DRAFT_TITLE, title)
    localStorage.setItem(DRAFT_CONTENT, content)
    localStorage.setItem(DRAFT_GROUP, selectedGroupId)
  }, [title, content, selectedGroupId])

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const result = await api.getGroups(1, 50)
        setGroups(result.groups.filter((g) => g.joinStatus === "joined"))
      } catch (error) {
        console.error("Failed to load groups:", error)
      }
    }
    loadGroups()
  }, [])

  useEffect(() => {
    const extractedTags = extractTags(content)
    setTags(extractedTags)
  }, [content])

  const handleSave = async (publish = false) => {
    if (title.trim().length < 5 || content.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Tiêu đề phải có ít nhất 5 ký tự và nội dung ít nhất 10 ký tự",
      })
      return
    }

    try {
      setSaving(true)
      const postData: any = {
        title: title.trim(),
        content: content.trim(),
        tags,
      }

      // Only include groupId if it's not "public"
      if (selectedGroupId && selectedGroupId !== "public") {
        postData.groupId = selectedGroupId
      }

      await api.createPost(postData)

      // Clear draft
      localStorage.removeItem(DRAFT_TITLE)
      localStorage.removeItem(DRAFT_CONTENT)
      localStorage.removeItem(DRAFT_GROUP)

      toast({
        title: "Thành công",
        description: publish ? "Bài viết đã được đăng" : "Bài viết đã được lưu",
      })

      if (publish) {
        router.push("/feed")
      }
    } catch (error: any) {
      console.error("Failed to save post:", error)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tạo bài viết. Vui lòng thử lại.",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = () => handleSave(true)

  const handleInsertMarkdown = (startTag: string, endTag: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = `${startTag}${selectedText}${endTag}`

    const newContent = content.substring(0, start) + replacement + content.substring(end)
    setContent(newContent)

    // Restore cursor position / selection
    // Defer the cursor update to allow React render cycle to complete
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + startTag.length, end + startTag.length)
    }, 0)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Tệp quá lớn", description: "Giới hạn 5MB", variant: "destructive" })
      return
    }

    try {
      const result = await upload(file)
      if (result) {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const imageMarkdown = `![${result.filename || result.original_filename || "Image"}](${result.url})`

        const newContent = content.substring(0, start) + imageMarkdown + content.substring(end)
        setContent(newContent)

        toast({ title: "Đã thêm ảnh", description: "Ảnh đã được tải lên bài viết" })
      }
    } catch (error) {
      console.error("Image upload failed", error)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const documentInputRef = useRef<HTMLInputElement>(null)

  const handleDocumentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Tệp quá lớn", description: "Giới hạn 10MB cho tài liệu", variant: "destructive" })
      return
    }

    try {
      const result = await upload(file)
      if (result) {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const docMarkdown = `[${result.filename || result.original_filename || "Document"}](${result.url})`

        const newContent = content.substring(0, start) + docMarkdown + content.substring(end)
        setContent(newContent)

        toast({ title: "Đã thêm tài liệu", description: "Tài liệu đã được tải lên bài viết" })
      }
    } catch (error) {
      console.error("Document upload failed", error)
    } finally {
      if (documentInputRef.current) documentInputRef.current.value = ""
    }
  }

  return (
    <AppShell showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tạo bài viết</h1>
            <p className="text-muted-foreground">Chia sẻ kiến thức và kinh nghiệm của bạn với cộng đồng</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Lưu nháp
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving || title.trim().length < 5 || content.trim().length < 10}
              className="bg-educonnect-primary hover:bg-educonnect-primary/90"
            >
              <Send className="mr-2 h-4 w-4" />
              Đăng bài
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title and Group Selection */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Tiêu đề bài viết (ít nhất 5 ký tự)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <div>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm (tùy chọn)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Đăng công khai</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content Editor */}
          <Tabs defaultValue="write" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="write">Viết</TabsTrigger>
                <TabsTrigger value="preview">Xem trước</TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
                  className="hidden"
                  onChange={handleDocumentSelect}
                />
                <Button variant="outline" size="sm" onClick={() => handleInsertMarkdown("#", "")}>
                  <Hash className="mr-2 h-4 w-4" />
                  Thẻ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  {isUploading ? `${progress}%` : "Hình ảnh"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => documentInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Tài liệu
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleInsertMarkdown("```\n", "\n```")}>
                  <Code className="mr-2 h-4 w-4" />
                  Code
                </Button>
              </div>
            </div>

            <TabsContent value="write" className="space-y-4">
              <Textarea
                ref={textareaRef}
                placeholder={`Chia sẻ kiến thức của bạn (ít nhất 10 ký tự)

Bạn có thể sử dụng Markdown để định dạng:
- **in đậm** hoặc *in nghiêng*
- \`code inline\` hoặc \`\`\`code block\`\`\`
- # Tiêu đề
- [liên kết](url)
- #hashtag để tạo thẻ

Hãy viết nội dung chất lượng để giúp đỡ cộng đồng!`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] resize-none font-mono"
              />

              {/* Tags Preview */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Thẻ được tìm thấy:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg p-6 min-h-[400px]">
                <h2 className="text-xl font-semibold mb-4">{title || "Tiêu đề bài viết"}</h2>
                <div className="prose prose-sm max-w-none break-words">
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">Nội dung bài viết sẽ hiển thị ở đây...</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">💡 Mẹo viết bài hiệu quả:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Sử dụng tiêu đề rõ ràng, mô tả chính xác nội dung</li>
              <li>• Thêm thẻ (#hashtag) để người khác dễ tìm thấy</li>
              <li>• Chia sẻ code với cú pháp ```javascript để highlight</li>
              <li>• Sử dụng ví dụ cụ thể để minh họa ý tưởng</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
