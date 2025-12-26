"use client"

import { useVideoCallContext } from "@/components/video/video-call-provider"
import { VideoCallModal } from "@/components/features/video/video-call-modal"

/**
 * Global component to display video call modal
 * Mounted at root layout to always be ready for calls
 */
export function VideoCallListener() {
  const { activeCall, closeCall } = useVideoCallContext()

  if (!activeCall || !activeCall.isOpen) {
    return null
  }

  return (
    <VideoCallModal
      isOpen={activeCall.isOpen}
      onClose={closeCall}
      participants={activeCall.participants}
      callType={activeCall.callType}
      callId={activeCall.callId}
      isIncoming={activeCall.isIncoming}
    />
  )
}
