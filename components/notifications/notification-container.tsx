"use client"

import { Toaster } from "@/components/ui/sonner"

/**
 * iPhone-style Notification Container
 * Quản lý layout, positioning, z-index với style giống iOS
 */
export const NotificationContainer = () => {
  return (
    <Toaster
      position="top-center"
      richColors={false}
      closeButton={false}
      offset="16px"
      gap={12}
      toastOptions={{
        duration: 5000,
        style: {
          maxWidth: "420px",
          width: "calc(100% - 32px)",
        },
      }}
      className="!top-4 !left-1/2 !-translate-x-1/2 !right-auto sm:!left-auto sm:!translate-x-0 sm:!right-4"
    />
  )
}
