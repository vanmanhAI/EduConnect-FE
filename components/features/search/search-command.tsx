"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, FileText, Search, TrendingUp, Clock } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { debounce } from "@/lib/utils"
import type { SearchResult } from "@/types"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [trendingSearches, setTrendingSearches] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load trending and recent searches on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const trending = await api.getTrendingSearches()
        setTrendingSearches(trending)

        // Load recent searches from localStorage
        const recent = localStorage.getItem("educonnect_recent_searches")
        if (recent) {
          setRecentSearches(JSON.parse(recent))
        }
      } catch (error) {
        console.error("Failed to load initial data:", error)
      }
    }

    if (open) {
      loadInitialData()
    }
  }, [open])

  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Get search suggestions
      const searchSuggestions = await api.getSearchSuggestions(searchQuery)
      setSuggestions(searchSuggestions)

      // Perform actual search
      const searchResults = await api.search(searchQuery)
      setResults(searchResults)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }, 300)

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const handleSelect = (value: string) => {
    onOpenChange(false)
    router.push(value)
    setQuery("")
    setResults(null)
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setQuery(suggestion)
    // Save to recent searches
    const updated = [suggestion, ...recentSearches.filter((s: string) => s !== suggestion)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("educonnect_recent_searches", JSON.stringify(updated))
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tìm kiếm bài viết, nhóm, người dùng..." value={query} onValueChange={setQuery} />
      <CommandList>
        {loading && <div className="py-6 text-center text-sm text-muted-foreground">Đang tìm kiếm...</div>}

        {!loading && !query && (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <CommandGroup heading="Tìm kiếm gần đây">
                {recentSearches.map((search: string) => (
                  <CommandItem key={search} value={search} onSelect={() => handleSuggestionSelect(search)}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Trending Searches */}
            {trendingSearches.length > 0 && (
              <CommandGroup heading="Tìm kiếm thịnh hành">
                {trendingSearches.slice(0, 5).map((search: string) => (
                  <CommandItem key={search} value={search} onSelect={() => handleSuggestionSelect(search)}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>{search}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Trending
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Search Suggestions */}
        {!loading && query && suggestions.length > 0 && (
          <CommandGroup heading="Gợi ý">
            {suggestions.map((suggestion: string) => (
              <CommandItem key={suggestion} value={suggestion} onSelect={() => handleSuggestionSelect(suggestion)}>
                <Search className="mr-2 h-4 w-4" />
                <span>{suggestion}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && query && !results && suggestions.length === 0 && (
          <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        )}

        {results && (
          <>
            {results.posts.length > 0 && (
              <CommandGroup heading="Bài viết">
                {results.posts.slice(0, 5).map((post: any) => (
                  <CommandItem key={post.id} value={`/posts/${post.id}`} onSelect={handleSelect}>
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium truncate">{post.title}</div>
                      <div className="text-xs text-muted-foreground">bởi {post.author.displayName}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.groups.length > 0 && (
              <CommandGroup heading="Nhóm">
                {results.groups.slice(0, 5).map((group: any) => (
                  <CommandItem key={group.id} value={`/groups/${group.id}`} onSelect={handleSelect}>
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={group.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-muted-foreground">{group.memberCount} thành viên</div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.users.length > 0 && (
              <CommandGroup heading="Người dùng">
                {results.users.slice(0, 5).map((user: any) => (
                  <CommandItem key={user.id} value={`/profile/${user.id}`} onSelect={handleSelect}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0) || user.username?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
