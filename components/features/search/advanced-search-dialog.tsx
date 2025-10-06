"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X, Calendar, User, Tag, Save, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Post, Group, User as UserType } from "@/types"

interface SearchFilters {
  query: string
  type: "all" | "posts" | "groups" | "users"
  sortBy: "relevance" | "date" | "popularity" | "trending"
  dateRange: {
    from?: Date
    to?: Date
  }
  tags: string[]
  authors: string[]
  groups: string[]
  minLikes?: number
  hasAttachments: boolean
  isFollowing: boolean
}

interface SavedSearch {
  id: string
  name: string
  filters: SearchFilters
  createdAt: Date
  lastUsed?: Date
}

interface AdvancedSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: (filters: SearchFilters) => void
  initialQuery?: string
}

const popularTags = [
  "javascript",
  "react",
  "typescript",
  "nextjs",
  "tailwind",
  "nodejs",
  "python",
  "design",
  "ui",
  "ux",
  "frontend",
  "backend",
  "database",
  "api",
  "mobile",
  "web",
  "programming",
  "tutorial",
  "tips",
]

const sortOptions = [
  { value: "relevance", label: "Liên quan nhất", icon: Search },
  { value: "date", label: "Mới nhất", icon: Calendar },
  { value: "popularity", label: "Phổ biến nhất", icon: TrendingUp },
  { value: "trending", label: "Thịnh hành", icon: TrendingUp },
]

export function AdvancedSearchDialog({ open, onOpenChange, onSearch, initialQuery = "" }: AdvancedSearchDialogProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: initialQuery,
    type: "all",
    sortBy: "relevance",
    dateRange: {},
    tags: [],
    authors: [],
    groups: [],
    hasAttachments: false,
    isFollowing: false,
  })

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState("")

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("educonnect_saved_searches")
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading saved searches:", error)
      }
    }
  }, [])

  // Generate search suggestions
  useEffect(() => {
    if (filters.query.length > 2) {
      const suggestions = popularTags
        .filter((tag) => tag.toLowerCase().includes(filters.query.toLowerCase()))
        .slice(0, 5)
      setSuggestions(suggestions)
    } else {
      setSuggestions([])
    }
  }, [filters.query])

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      await onSearch(filters)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSearch = () => {
    if (!saveName.trim()) return

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: saveName,
      filters: { ...filters },
      createdAt: new Date(),
      lastUsed: new Date(),
    }

    const updated = [...savedSearches, newSavedSearch]
    setSavedSearches(updated)
    localStorage.setItem("educonnect_saved_searches", JSON.stringify(updated))
    setShowSaveDialog(false)
    setSaveName("")
  }

  const handleLoadSavedSearch = (savedSearch: SavedSearch) => {
    setFilters({ ...savedSearch.filters })
    // Update last used
    const updated = savedSearches.map((s) => (s.id === savedSearch.id ? { ...s, lastUsed: new Date() } : s))
    setSavedSearches(updated)
    localStorage.setItem("educonnect_saved_searches", JSON.stringify(updated))
  }

  const handleDeleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem("educonnect_saved_searches", JSON.stringify(updated))
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      setFilters((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    }
  }

  const removeTag = (tag: string) => {
    setFilters((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const clearFilters = () => {
    setFilters({
      query: "",
      type: "all",
      sortBy: "relevance",
      dateRange: {},
      tags: [],
      authors: [],
      groups: [],
      hasAttachments: false,
      isFollowing: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tìm kiếm nâng cao
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Query Input */}
            <div className="space-y-2">
              <Label htmlFor="search-query">Từ khóa tìm kiếm</Label>
              <div className="relative">
                <Input
                  id="search-query"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={filters.query}
                  onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestions.map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => addTag(suggestion)}
                    >
                      + {suggestion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Type and Sort */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại nội dung</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value: any) => setFilters((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="posts">Bài viết</SelectItem>
                    <SelectItem value="groups">Nhóm</SelectItem>
                    <SelectItem value="users">Người dùng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sắp xếp theo</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: any) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Khoảng thời gian</Label>
              <div className="grid grid-cols-2 gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateRange.from
                        ? format(filters.dateRange.from, "dd/MM/yyyy", { locale: vi })
                        : "Từ ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, from: date },
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy", { locale: vi }) : "Đến ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, to: date },
                        }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Thẻ (Tags)</Label>
              <div className="flex flex-wrap gap-2">
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.slice(0, 8).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => addTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div className="space-y-4">
              <Label>Bộ lọc bổ sung</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasAttachments"
                    checked={filters.hasAttachments}
                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, hasAttachments: !!checked }))}
                  />
                  <Label htmlFor="hasAttachments">Chỉ hiển thị bài viết có đính kèm</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFollowing"
                    checked={filters.isFollowing}
                    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, isFollowing: !!checked }))}
                  />
                  <Label htmlFor="isFollowing">Chỉ hiển thị từ người đang theo dõi</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                {isLoading ? "Đang tìm kiếm..." : "Tìm kiếm"}
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-2" />
                Lưu
              </Button>
            </div>
          </div>

          {/* Saved Searches Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tìm kiếm đã lưu</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="space-y-2">
                {savedSearches.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có tìm kiếm nào được lưu</p>
                  </div>
                ) : (
                  savedSearches.map((savedSearch) => (
                    <Card key={savedSearch.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{savedSearch.name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSavedSearch(savedSearch.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {savedSearch.filters.query || "Không có từ khóa"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSavedSearch(savedSearch)}
                            className="h-7 text-xs"
                          >
                            Sử dụng
                          </Button>
                          {savedSearch.lastUsed && (
                            <span className="text-xs text-muted-foreground">
                              {format(savedSearch.lastUsed, "dd/MM", { locale: vi })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Save Search Dialog */}
        {showSaveDialog && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lưu tìm kiếm</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="save-name">Tên tìm kiếm</Label>
                  <Input
                    id="save-name"
                    placeholder="Nhập tên cho tìm kiếm này..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleSaveSearch} disabled={!saveName.trim()}>
                    Lưu
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
