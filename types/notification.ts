/**
 * Shared types cho notifications
 * Sync với backend types
 */

export type NotificationType =
  | "message"
  | "like"
  | "comment"
  | "follow"
  | "group_invite"
  | "badge"
  | "mention"
  | "system"
  | "achievement"

export interface NotificationActor {
  id: string
  displayName?: string
  avatar?: string
  username?: string
}

export interface NotificationPayload {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  actorId?: string
  createdAt: Date
  isRead?: boolean // Optional vì có thể không có từ socket
  readAt?: Date
  actor?: NotificationActor
}

export interface Notification extends NotificationPayload {
  isRead: boolean
  readAt?: Date
}
