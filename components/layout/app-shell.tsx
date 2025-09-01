"use client"

import type React from "react"

import { useState } from "react"
import { TopNav } from "./top-nav"
import { LeftSidebar } from "./left-sidebar"
import { RightSidebar } from "./right-sidebar"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  showRightSidebar?: boolean
  rightSidebarContent?: React.ReactNode
}

export function AppShell({ children, showRightSidebar = true, rightSidebarContent }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:ml-64">
          <div className={cn("mx-auto max-w-7xl px-4 py-6", showRightSidebar ? "lg:pr-80" : "")}>{children}</div>
        </main>

        {showRightSidebar && <RightSidebar>{rightSidebarContent}</RightSidebar>}
      </div>
    </div>
  )
}
