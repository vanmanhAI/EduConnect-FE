/**
 * Notification Queue System
 * Quản lý queue notifications để hiển thị tuần tự, tránh spam
 */

import type { NotificationPayload } from "@/types/notification"

interface QueuedNotification {
  notification: NotificationPayload
  timestamp: number
  priority: number
}

class NotificationQueue {
  private queue: QueuedNotification[] = []
  private processing = false
  private currentToastId: string | null = null
  private readonly minInterval = 2000 // Tối thiểu 2 giây giữa các notifications
  private lastShownTime = 0

  /**
   * Thêm notification vào queue
   */
  enqueue(notification: NotificationPayload, priority: number = 0): void {
    if (this.queue.some((q) => q.notification.id === notification.id)) {
      return
    }

    this.queue.push({
      notification,
      timestamp: Date.now(),
      priority,
    })

    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.timestamp - b.timestamp
    })

    this.processQueue()
  }

  /**
   * Xử lý queue tuần tự
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const queued = this.queue.shift()
      if (!queued) break

      const timeSinceLastShown = Date.now() - this.lastShownTime
      if (timeSinceLastShown < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLastShown
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("show-notification", {
            detail: queued.notification,
          })
        )
      }

      this.lastShownTime = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    this.processing = false
  }

  /**
   * Xóa notification khỏi queue
   */
  remove(notificationId: string): void {
    this.queue = this.queue.filter((q) => q.notification.id !== notificationId)
  }

  /**
   * Xóa tất cả notifications khỏi queue
   */
  clear(): void {
    this.queue = []
  }

  /**
   * Lấy số lượng notifications trong queue
   */
  getLength(): number {
    return this.queue.length
  }
}

export const notificationQueue = new NotificationQueue()
