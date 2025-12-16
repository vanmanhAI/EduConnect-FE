"use client"

import { toast as sonnerToast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getNotificationIcon, getNotificationColor } from "@/lib/notifications/utils"
import type { NotificationPayload } from "@/types/notification"
import { cn } from "@/lib/utils"

interface NotificationToastProps {
  notification: NotificationPayload
  onClick?: () => void
  duration?: number
}

/**
 * iPhone-style Notification Toast
 * - Glassmorphism effect với backdrop blur
 * - Rounded corners lớn
 * - Smooth animations
 * - Clean typography
 */
export const showNotificationToast = ({ notification, onClick, duration = 5000 }: NotificationToastProps) => {
  const { Icon, className: iconClassName } = getNotificationIcon(notification.type)

  try {
    const toastId = sonnerToast.custom(
      (t: any) => {
        const isVisible = t?.visible !== false

        return (
          <div
            className={cn(
              // Base styles - iPhone-like
              "group relative flex items-start gap-3",
              "w-full max-w-[420px]",
              "sm:min-w-[320px]",
              "rounded-2xl p-4",
              "bg-white/90 dark:bg-gray-900/90",
              "backdrop-blur-xl backdrop-saturate-150",
              "border border-white/20 dark:border-gray-700/50",
              "shadow-2xl shadow-black/10 dark:shadow-black/30",
              "cursor-pointer",
              "transition-all duration-300 ease-out",
              "hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/20",
              // Animations
              isVisible
                ? "animate-in slide-in-from-top-4 fade-in-0 zoom-in-95"
                : "animate-out slide-out-to-right-full fade-out-0 zoom-out-95"
            )}
            onClick={() => {
              onClick?.()
              sonnerToast.dismiss(t)
            }}
          >
            {/* Icon với background circle */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-sm" />
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
                <Icon className={cn(iconClassName, "h-5 w-5")} />
              </div>
            </div>

            {/* Avatar */}
            {notification.actor && (
              <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-white/50 dark:ring-gray-700/50">
                <AvatarImage src={notification.actor.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                  {notification.actor.displayName?.charAt(0) || notification.actor.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                {notification.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Close indicator (subtle) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            </div>

            {/* Shine effect on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
          </div>
        )
      },
      {
        duration,
        position: "top-center",
        className: "!p-0",
      }
    )

    return toastId
  } catch (error) {
    console.error("Lỗi khi tạo toast:", error)
    throw error
  }
}
