import { useState, useEffect } from "react"
import { LiveKitRoom, VideoConference } from "@livekit/components-react"
import "@livekit/components-styles"
import { Maximize, Minimize } from "lucide-react"

interface LiveKitRoomWrapperProps {
  token: string
  serverUrl: string
  connect: boolean
  onDisconnected?: () => void
  audio?: boolean
  video?: boolean
}

export function LiveKitRoomWrapper({
  token,
  serverUrl,
  connect,
  onDisconnected,
  audio = true,
  video = true,
}: LiveKitRoomWrapperProps) {
  if (!token) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={video}
      audio={audio}
      token={token}
      serverUrl={serverUrl}
      connect={connect}
      onDisconnected={onDisconnected}
      data-lk-theme="default"
      style={{ height: "100dvh" }}
    >
      <VideoConference />
      <FullscreenToggle />
    </LiveKitRoom>
  )
}

function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const doc = document as any
    const elem = document.documentElement as any

    // Check if fullscreen API is supported
    const supported = !!(
      elem.requestFullscreen ||
      elem.webkitRequestFullscreen ||
      elem.mozRequestFullScreen ||
      elem.msRequestFullscreen
    )
    setIsSupported(supported)

    // Listener for fullscreen change
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement)
      )
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  // Helper to request fullscreen
  const requestFullscreen = () => {
    const doc = document as any
    const elem = document.documentElement as any

    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err: any) => console.error("Error enabling fullscreen:", err))
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen()
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen()
    }
  }

  const toggleFullscreen = () => {
    const doc = document as any

    // --- iOS WORKAROUND ---
    // iOS Safari does not support requestFullscreen API for elements.
    // We show an alert guiding them to "Add to Home Screen".
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS && !isSupported) {
      alert(
        "Trên iPhone/iPad: Hãy nhấn nút Chia sẻ (Share) > 'Thêm vào MH chính' (Add to Home Screen) để dùng Fullscreen."
      )
      return
    }

    if (!isFullscreen) {
      requestFullscreen()
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen()
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen()
      }
    }
  }

  // Always render button, but behavior depends on support
  return (
    <button
      onClick={toggleFullscreen}
      className="absolute top-2 left-2 z-[60] p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-all"
      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      title="Toàn màn hình"
    >
      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
    </button>
  )
}
