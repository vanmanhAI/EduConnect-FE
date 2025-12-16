/**
 * Smart Notification Filtering
 * Quyết định có nên hiển thị notification hay không dựa trên context
 */

import type { NotificationPayload } from "@/types/notification"

interface FilterContext {
  currentPath?: string
  activeConversationId?: string
  isTabActive: boolean
  userSettings?: {
    soundEnabled?: boolean
    vibrationEnabled?: boolean
    showWhenActive?: boolean
  }
}

/**
 * Kiểm tra xem có nên hiển thị notification không
 */
export const shouldShowNotification = (notification: NotificationPayload, context: FilterContext): boolean => {
  if (!context.isTabActive) {
    return false
  }

  if (notification.type === "message" && notification.actionUrl) {
    const conversationId = extractConversationIdFromUrl(notification.actionUrl)
    if (conversationId && context.activeConversationId === conversationId) {
      return false
    }
  }

  if (notification.actionUrl && context.currentPath) {
    const notificationPath = extractPathFromUrl(notification.actionUrl)
    if (context.currentPath === notificationPath) {
      return false
    }
  }

  if (notification.type === "system" || notification.type === "achievement") {
    return true
  }

  return true
}

/**
 * Extract conversation ID từ URL
 */
const extractConversationIdFromUrl = (url: string): string | null => {
  // Format: /chat/{conversationId}
  const match = url.match(/\/chat\/([^/?]+)/)
  return match ? match[1] : null
}

/**
 * Extract path từ URL (bỏ query params và hash)
 */
const extractPathFromUrl = (url: string): string => {
  if (typeof window === "undefined") {
    // Server-side: chỉ extract path đơn giản
    return url.split("?")[0].split("#")[0]
  }

  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.pathname
  } catch {
    // Nếu là relative URL
    return url.split("?")[0].split("#")[0]
  }
}

/**
 * Lấy priority cho notification (cao hơn = hiển thị trước)
 */
export const getNotificationPriority = (notification: NotificationPayload): number => {
  switch (notification.type) {
    case "message":
      return 10 // Tin nhắn có priority cao
    case "mention":
      return 9 // Mention có priority cao
    case "achievement":
      return 8
    case "badge":
      return 7
    case "system":
      return 6
    case "like":
      return 3
    case "comment":
      return 4
    case "follow":
      return 2
    case "group_invite":
      return 5
    default:
      return 1
  }
}
