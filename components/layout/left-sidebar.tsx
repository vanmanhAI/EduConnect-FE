"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Users, MessageSquare, Trophy, Award, UserPlus, X, PenSquare, Video, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LeftSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: "Trang chủ", href: "/", icon: Home },
  { name: "Bảng tin", href: "/feed", icon: PenSquare },
  { name: "Nhóm", href: "/groups", icon: Users },
  { name: "Tin nhắn", href: "/messages", icon: MessageSquare },

  { name: "Mọi người", href: "/people", icon: UserPlus },
  { name: "Bảng xếp hạng", href: "/leaderboard", icon: Trophy },
  { name: "Huy hiệu", href: "/badges", icon: Award },
  { name: "Đã lưu", href: "/bookmarks", icon: Bookmark },
]

export function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-[55] bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 z-[60] w-64 transform bg-background border-r transition-transform duration-200 ease-in-out",
          "top-0 h-screen lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-educonnect-primary text-white hover:bg-educonnect-primary/90"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Create post button */}
          <div className="p-4">
            <Button asChild className="w-full bg-educonnect-primary hover:bg-educonnect-primary/90">
              <Link href="/compose">
                <PenSquare className="mr-2 h-4 w-4" />
                Tạo bài viết
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
