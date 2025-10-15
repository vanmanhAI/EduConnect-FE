"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Save, Send, Hash, ImageIcon, Code } from "lucide-react"
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
import type { Group } from "@/types"

export default function ComposePage() {
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
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề và nội dung bài viết",
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
              disabled={saving || !title.trim() || !content.trim()}
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
                placeholder="Tiêu đề bài viết..."
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
                <Button variant="outline" size="sm">
                  <Hash className="mr-2 h-4 w-4" />
                  Thẻ
                </Button>
                <Button variant="outline" size="sm">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Hình ảnh
                </Button>
                <Button variant="outline" size="sm">
                  <Code className="mr-2 h-4 w-4" />
                  Code
                </Button>
              </div>
            </div>

            <TabsContent value="write" className="space-y-4">
              <Textarea
                placeholder="Chia sẻ kiến thức của bạn... 

Bạn có thể sử dụng Markdown để định dạng:
- **in đậm** hoặc *in nghiêng*
- `code inline` hoặc \`\`\`code block\`\`\`
- # Tiêu đề
- [liên kết](url)
- #hashtag để tạo thẻ

Hãy viết nội dung chất lượng để giúp đỡ cộng đồng!"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px] resize-none"
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
                <div className="prose prose-sm max-w-none">
                  {content ? (
                    <pre className="whitespace-pre-wrap font-sans">{content}</pre>
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
