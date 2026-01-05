"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      onOpenChange(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery("")
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          type="text"
          placeholder="Tìm kiếm bài viết..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          autoFocus
        />
      </div>
      <CommandList>
        <CommandEmpty>
          {query ? (
            <div className="py-6 text-center text-sm">
              Nhấn{" "}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                Enter
              </kbd>{" "}
              để tìm kiếm "{query}"
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nhập từ khóa và nhấn Enter để tìm kiếm...
            </div>
          )}
        </CommandEmpty>
      </CommandList>
    </CommandDialog>
  )
}
