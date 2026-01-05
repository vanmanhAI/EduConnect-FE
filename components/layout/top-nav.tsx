"use client"
import type { KeyboardEvent } from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Notification } from "@/types"
import { Search, Bell, Menu, Trophy, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarWithStatus } from "@/components/ui/avatar-with-status"
import { SearchCommand } from "@/components/features/search/search-command"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { formatPoints } from "@/lib/utils"

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const router = useRouter()
  const { user, logout: authLogout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: Event) => {
      const keyEvent = e as unknown as KeyboardEvent
      if ((keyEvent.metaKey || keyEvent.ctrlKey) && keyEvent.key === "k") {
        keyEvent.preventDefault()
        setSearchOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = () => {
    // Sử dụng logout function từ AuthContext
    authLogout()
    router.push("/login")
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="flex h-16 items-center justify-between px-2 sm:px-4 max-w-7xl mx-auto gap-2 min-w-0">
          {/* Left section */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-educonnect-primary to-educonnect-accent rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs sm:text-sm">EC</span>
              </div>
              <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-educonnect-primary to-educonnect-accent bg-clip-text text-transparent hidden sm:inline">
                EduConnect
              </span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground bg-muted/50 border-0 hover:bg-background hover:ring-2 hover:ring-educonnect-primary/20 transition-all h-9 sm:h-10 text-xs sm:text-sm"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Tìm kiếm bài viết, nhóm, người dùng...</span>
              <span className="hidden sm:inline md:hidden truncate">Tìm kiếm...</span>
              <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex flex-shrink-0">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Auth buttons for non-logged in users */}
            {!user && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm" asChild>
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-educonnect-primary hover:bg-educonnect-primary/90"
                  asChild
                >
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Points display */}
            {user && (
              <div className="hidden md:flex items-center space-x-2 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-educonnect-primary/10 to-educonnect-accent/10 rounded-full border border-educonnect-primary/20">
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-educonnect-primary" />
                <span className="text-xs sm:text-sm font-semibold text-educonnect-primary">
                  {formatPoints(user.points)}
                </span>
              </div>
            )}

            {/* Messages */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-9 sm:w-9 hover:bg-educonnect-primary/10"
                asChild
              >
                <Link href="/messages">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
            )}

            {/* Notifications */}
            {user && <NotificationCenter />}

            {/* User menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:ring-2 hover:ring-educonnect-primary/20 transition-all p-0"
                  >
                    <AvatarWithStatus
                      src={user.avatar}
                      fallback={user.displayName.charAt(0)}
                      alt={user.displayName}
                      isOnline={user.isOnline}
                      showStatus={user.profileVisibility === "public"}
                      className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-background"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile/me">
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <span>Cài đặt</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
