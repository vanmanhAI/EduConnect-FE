import type { NotificationType } from "@/types/notification"
import type { LucideIcon } from "lucide-react"
import { MessageCircle, Heart, MessageSquare, UserPlus, Users, Award, AtSign, Bell, Trophy } from "lucide-react"

/**
 * Utility functions tái sử dụng cho notifications
 */

/**
 * Lấy icon component và className theo notification type
 */
export const getNotificationIcon = (type: NotificationType): { Icon: LucideIcon; className: string } => {
  const iconClass = "h-4 w-4"
  switch (type) {
    case "message":
      return { Icon: MessageCircle, className: `${iconClass} text-blue-500` }
    case "like":
      return { Icon: Heart, className: `${iconClass} text-red-500` }
    case "comment":
      return { Icon: MessageSquare, className: `${iconClass} text-blue-500` }
    case "follow":
      return { Icon: UserPlus, className: `${iconClass} text-green-500` }
    case "group_invite":
      return { Icon: Users, className: `${iconClass} text-purple-500` }
    case "badge":
      return { Icon: Award, className: `${iconClass} text-yellow-500` }
    case "mention":
      return { Icon: AtSign, className: `${iconClass} text-orange-500` }
    case "achievement":
      return { Icon: Trophy, className: `${iconClass} text-amber-500` }
    case "system":
    default:
      return { Icon: Bell, className: `${iconClass} text-gray-500` }
  }
}

/**
 * Lấy màu sắc theo notification type
 */
export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case "message":
      return "bg-blue-50 border-blue-200 text-blue-900"
    case "like":
      return "bg-red-50 border-red-200 text-red-900"
    case "comment":
      return "bg-blue-50 border-blue-200 text-blue-900"
    case "follow":
      return "bg-green-50 border-green-200 text-green-900"
    case "group_invite":
      return "bg-purple-50 border-purple-200 text-purple-900"
    case "badge":
      return "bg-yellow-50 border-yellow-200 text-yellow-900"
    case "mention":
      return "bg-orange-50 border-orange-200 text-orange-900"
    case "achievement":
      return "bg-amber-50 border-amber-200 text-amber-900"
    case "system":
    default:
      return "bg-gray-50 border-gray-200 text-gray-900"
  }
}

/**
 * Format notification message
 */
export const formatNotificationMessage = (message: string, maxLength: number = 100): string => {
  if (message.length <= maxLength) {
    return message
  }
  return message.substring(0, maxLength) + "..."
}

/**
 * Logic quyết định có hiển thị notification không
 * @deprecated Sử dụng shouldShowNotification từ notification-filter.ts thay thế
 */
export const shouldShowNotification = (
  notification: { type: NotificationType; isRead: boolean },
  isActiveTab: boolean = true
): boolean => {
  // Chỉ hiển thị nếu tab đang active
  if (!isActiveTab) {
    return false
  }

  // Có thể thêm logic khác ở đây (ví dụ: filter theo settings)
  return true
}
