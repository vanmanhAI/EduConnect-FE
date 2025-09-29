import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "Vừa xong"
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`

  return date.toLocaleDateString("vi-VN")
}

export function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  return `${(num / 1000000).toFixed(1)}M`
}

export function formatPoints(points: number): string {
  return formatNumber(points)
}

export function getUserLevel(points: number): number {
  return Math.floor(points / 250) + 1
}

export function getPointsToNextLevel(points: number): number {
  const currentLevel = getUserLevel(points)
  const nextLevelPoints = currentLevel * 250
  return nextLevelPoints - points
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function extractTags(content: string): string[] {
  const tagRegex = /#(\w+)/g
  const matches = content.match(tagRegex)
  return matches ? matches.map((tag) => tag.slice(1)) : []
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Parse query params for groups search/filter/pagination from URLSearchParams
export function parseGroupsQueryParams(params: URLSearchParams) {
  const q = params.get("q") || ""
  const filter = params.get("filter") || "all"
  const tab = params.get("tab") || "all"
  const pageParam = Number(params.get("page") || "1")
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  return { q, filter, tab, page }
}
