"use client"

import dynamic from "next/dynamic"

// Dynamic import with SSR disabled for video call components
// These components use browser-only APIs (WebRTC, MediaDevices)
const VideoCallProvider = dynamic(
  () => import("@/components/video/video-call-provider").then((mod) => ({ default: mod.VideoCallProvider })),
  { ssr: false }
)
const VideoCallListener = dynamic(
  () => import("@/components/video/incoming-call-listener").then((mod) => ({ default: mod.VideoCallListener })),
  { ssr: false }
)

interface VideoCallWrapperProps {
  children: React.ReactNode
}

export function VideoCallWrapper({ children }: VideoCallWrapperProps) {
  return (
    <VideoCallProvider>
      {children}
      <VideoCallListener />
    </VideoCallProvider>
  )
}
