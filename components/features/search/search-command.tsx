"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Users, FileText } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tìm kiếm bài viết, nhóm, người dùng..." value={query} onValueChange={setQuery} />
      <CommandList>
        {loading && <div className="py-6 text-center text-sm text-muted-foreground">Đang tìm kiếm...</div>}

        {!loading && query && !results && <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>}

        {results && (
          <>
            {results.posts.length > 0 && (
              <CommandGroup heading="Bài viết">
                {results.posts.slice(0, 5).map((post) => (
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
                {results.groups.slice(0, 5).map((group) => (
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
                {results.users.slice(0, 5).map((user) => (
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
