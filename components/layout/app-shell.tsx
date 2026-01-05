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
  noPadding?: boolean
}

export function AppShell({ children, showRightSidebar = true, rightSidebarContent, noPadding = false }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex min-w-0">
        <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:ml-64 min-w-0 overflow-x-hidden">
          <div className={cn("mx-auto max-w-7xl", noPadding ? "p-0" : "px-4 py-6", showRightSidebar ? "lg:pr-80" : "")}>
            {children}
          </div>
        </main>

        {showRightSidebar && <RightSidebar>{rightSidebarContent}</RightSidebar>}
      </div>
    </div>
  )
}
