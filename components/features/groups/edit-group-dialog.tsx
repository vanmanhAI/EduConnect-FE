"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { Group } from "@/types"

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  onSave: (data: { name: string; description: string; tags: string[] }) => Promise<void>
}

export function EditGroupDialog({ open, onOpenChange, group, onSave }: EditGroupDialogProps) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize tags from group
  useEffect(() => {
    if (group.tags) {
      const tagStrings = Array.isArray(group.tags)
        ? group.tags.map((t) => {
            const tagName = typeof t === "string" ? t : t.name
            return tagName.startsWith("#") ? tagName : `#${tagName}`
          })
        : []
      setTags(tagStrings)
    }
  }, [group.tags])

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return

    // Add # if not present
    const formattedTag = trimmedTag.startsWith("#") ? trimmedTag : `#${trimmedTag}`

    // Check if tag already exists
    if (tags.includes(formattedTag)) {
      setError("Tag này đã tồn tại")
      return
    }

    setTags([...tags, formattedTag])
    setTagInput("")
    setError(null)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError("Tên nhóm không được để trống")
      return
    }

    if (!description.trim()) {
      setError("Mô tả nhóm không được để trống")
      return
    }

    if (tags.length === 0) {
      setError("Vui lòng thêm ít nhất một tag")
      return
    }

    setLoading(true)

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        tags,
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật nhóm")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cài đặt nhóm</DialogTitle>
          <DialogDescription>Cập nhật thông tin cho nhóm của bạn</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên nhóm *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về nhóm của bạn"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 ký tự</p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags *</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tag và nhấn Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Thêm
              </Button>
            </div>

            {/* Display tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-sm px-3 py-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
