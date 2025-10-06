"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X, Calendar, User, Tag, TrendingUp, MessageCircle, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { formatDate, truncateText } from "@/lib/utils"
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

interface SearchResultsProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

interface SearchResult {
  posts: Post[]
  groups: Group[]
  users: UserType[]
  total: number
  query: string
  took: number
}

// Highlight text function
function highlightText(text: string, query: string): string {
  if (!query.trim()) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
}

// Search result item components
function PostSearchResult({ post, query }: { post: Post; query: string }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post.likeCount)

  const handleLike = async () => {
    try {
      if (isLiked) {
        await api.unlikePost(post.id)
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      } else {
        await api.likePost(post.id)
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {post.author.displayName?.charAt(0) || post.author.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-medium">{post.author.displayName || post.author.username || "Unknown User"}</span>
                {post.group && (
                  <div className="flex items-center gap-1 basis-full sm:basis-auto text-sm">
                    <span className="text-muted-foreground">trong</span>
                    <span className="text-educonnect-primary font-medium">{post.group.name}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3
            className="text-lg font-semibold mb-2"
            dangerouslySetInnerHTML={{
              __html: highlightText(post.title, query),
            }}
          />

          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: highlightText(truncateText(post.content, 300), query),
            }}
          />

          {post.content.length > 300 && (
            <Button variant="link" className="p-0 h-auto text-educonnect-primary">
              Đọc thêm
            </Button>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-red-500 hover:text-red-600" : ""}
            >
              <Heart className={`mr-1 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>

            <Button variant="ghost" size="sm">
              <MessageCircle className="mr-1 h-4 w-4" />
              {post.commentCount}
            </Button>

            <Button variant="ghost" size="sm">
              <Share2 className="mr-1 h-4 w-4" />
              Chia sẻ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GroupSearchResult({ group, query }: { group: Group; query: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={group.avatar || "/placeholder.svg"} />
            <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h3
              className="text-lg font-semibold"
              dangerouslySetInnerHTML={{
                __html: highlightText(group.name, query),
              }}
            />

            <p
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: highlightText(truncateText(group.description, 200), query),
              }}
            />

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{group.memberCount} thành viên</span>
              <span>{group.postCount} bài viết</span>
              <span>
                {formatDate(typeof group.createdAt === "string" ? new Date(group.createdAt) : group.createdAt)}
              </span>
            </div>

            {group.tags && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {group.tags.slice(0, 5).map((tag, index) => {
                  const tagText = typeof tag === "string" ? tag : tag.name
                  const tagKey = typeof tag === "string" ? tag : tag.id
                  return (
                    <Badge key={tagKey || index} variant="secondary" className="text-xs">
                      #{tagText}
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm">
            Tham gia
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function UserSearchResult({ user, query }: { user: UserType; query: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{user.displayName?.charAt(0) || user.username?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <h3
              className="text-lg font-semibold"
              dangerouslySetInnerHTML={{
                __html: highlightText(user.displayName || user.username, query),
              }}
            />

            <p className="text-muted-foreground">@{user.username}</p>

            {user.bio && (
              <p
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: highlightText(truncateText(user.bio, 150), query),
                }}
              />
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{user.followers} người theo dõi</span>
              <span>{user.postsCount || 0} bài viết</span>
              <span>Level {user.level}</span>
            </div>
          </div>

          <Button variant="outline" size="sm">
            Theo dõi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SearchResults({ filters, onFiltersChange }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Perform search when filters change
  useEffect(() => {
    if (filters.query.trim()) {
      performSearch()
    } else {
      setResults(null)
    }
  }, [filters])

  const performSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use advanced search API
      const searchResults = await api.advancedSearch({
        query: filters.query,
        type: filters.type,
        sortBy: filters.sortBy,
        dateRange: filters.dateRange,
        tags: filters.tags,
        authors: filters.authors,
        groups: filters.groups,
        minLikes: filters.minLikes,
        hasAttachments: filters.hasAttachments,
        isFollowing: filters.isFollowing,
      })

      setResults({
        posts: searchResults.posts,
        groups: searchResults.groups,
        users: searchResults.users,
        total: searchResults.total,
        query: searchResults.query,
        took: searchResults.took,
      })
    } catch (err) {
      setError("Không thể thực hiện tìm kiếm. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      query: "",
      tags: [],
      dateRange: {},
      hasAttachments: false,
      isFollowing: false,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Kết quả tìm kiếm</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={performSearch}>Thử lại</Button>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Bắt đầu tìm kiếm</h3>
        <p className="text-muted-foreground">Nhập từ khóa để tìm kiếm bài viết, nhóm và người dùng</p>
      </div>
    )
  }

  const totalResults = results.posts.length + results.groups.length + results.users.length

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Kết quả tìm kiếm cho "{results.query}"</h2>
          <p className="text-sm text-muted-foreground">
            {totalResults} kết quả trong {Math.round(results.took)}ms
          </p>
        </div>

        {totalResults > 0 && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {(filters.tags.length > 0 || filters.dateRange.from || filters.dateRange.to || filters.hasAttachments) && (
        <div className="flex flex-wrap gap-2">
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    tags: filters.tags.filter((t) => t !== tag),
                  })
                }
              />
            </Badge>
          ))}

          {filters.dateRange.from && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Từ {formatDate(filters.dateRange.from)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, from: undefined },
                  })
                }
              />
            </Badge>
          )}

          {filters.hasAttachments && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Có đính kèm
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    hasAttachments: false,
                  })
                }
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tất cả ({totalResults})</TabsTrigger>
          {results.posts.length > 0 && <TabsTrigger value="posts">Bài viết ({results.posts.length})</TabsTrigger>}
          {results.groups.length > 0 && <TabsTrigger value="groups">Nhóm ({results.groups.length})</TabsTrigger>}
          {results.users.length > 0 && <TabsTrigger value="users">Người dùng ({results.users.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {totalResults === 0 ? (
            <EmptyState
              title="Không tìm thấy kết quả"
              description="Thử thay đổi từ khóa hoặc bộ lọc để tìm thấy nội dung phù hợp hơn"
            />
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostSearchResult key={post.id} post={post} query={results.query} />
                ))}
                {results.groups.map((group) => (
                  <GroupSearchResult key={group.id} group={group} query={results.query} />
                ))}
                {results.users.map((user) => (
                  <UserSearchResult key={user.id} user={user} query={results.query} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4 mt-6">
          {results.posts.length === 0 ? (
            <EmptyState
              title="Không có bài viết nào"
              description="Thử thay đổi từ khóa hoặc bộ lọc để tìm thấy bài viết phù hợp"
            />
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {results.posts.map((post) => (
                  <PostSearchResult key={post.id} post={post} query={results.query} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4 mt-6">
          {results.groups.length === 0 ? (
            <EmptyState
              title="Không có nhóm nào"
              description="Thử thay đổi từ khóa hoặc bộ lọc để tìm thấy nhóm phù hợp"
            />
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {results.groups.map((group) => (
                  <GroupSearchResult key={group.id} group={group} query={results.query} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          {results.users.length === 0 ? (
            <EmptyState
              title="Không có người dùng nào"
              description="Thử thay đổi từ khóa hoặc bộ lọc để tìm thấy người dùng phù hợp"
            />
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {results.users.map((user) => (
                  <UserSearchResult key={user.id} user={user} query={results.query} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
