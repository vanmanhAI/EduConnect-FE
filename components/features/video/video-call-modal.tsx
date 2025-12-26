"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Monitor, Settings, Volume2 } from "lucide-react"
import type { User } from "@/types"
import { useVideoCallContext } from "@/components/video/video-call-provider"

interface VideoCallModalProps {
  isOpen: boolean
  onClose: () => void
  participants: User[]
  callType: "audio" | "video"
  callId: string
  isIncoming?: boolean
}

export function VideoCallModal({
  isOpen,
  onClose,
  participants,
  callType,
  callId,
  isIncoming = false,
}: VideoCallModalProps) {
  const [callDuration, setCallDuration] = useState(0)

  // Get everything from context - single source of truth
  const {
    isConnected,
    isConnecting,
    isMuted,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    acceptIncomingCall,
    rejectIncomingCall,
    closeCall,
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    hasCameraAccess,
    hasMicAccess,
    mediaError,
    // Remote media state
    remoteMuted,
    remoteVideoEnabled,
    // Speaking indicators
    localSpeaking,
    remoteSpeaking,
  } = useVideoCallContext()

  // Track if this is an incoming call (for UI purposes only)
  const [localIsIncoming, setLocalIsIncoming] = useState(isIncoming)

  // Sync incoming state from props
  useEffect(() => {
    setLocalIsIncoming(isIncoming)
  }, [isIncoming])

  // When connected, switch from incoming view
  useEffect(() => {
    if (isConnected) {
      setLocalIsIncoming(false)
    }
  }, [isConnected])

  // *** CRITICAL: Sync local stream to video element ***
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("[VideoCallModal] Syncing local stream to video element")
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch((e) => console.warn("[VideoCallModal] Local video play error:", e))
    }
  }, [localStream, localVideoRef])

  // *** CRITICAL: Sync remote stream to video element ***
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("[VideoCallModal] Syncing remote stream to video element")
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch((e) => console.warn("[VideoCallModal] Remote video play error:", e))
    }
  }, [remoteStream, remoteVideoRef])

  // Call Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [isConnected])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle Accept (Callee)
  const handleAcceptCall = async () => {
    try {
      setLocalIsIncoming(false) // Switch to active call view immediately
      await acceptIncomingCall()
    } catch (error) {
      console.error("Failed to accept call:", error)
    }
  }

  const handleDeclineCall = () => {
    rejectIncomingCall()
    onClose()
  }

  const handleEndCall = () => {
    closeCall()
    onClose()
  }

  const getStatusText = () => {
    if (isConnected) return formatDuration(callDuration)
    if (isConnecting) return "Đang kết nối..."
    if (localIsIncoming) return "Cuộc gọi đến..."
    return "Đang gọi..."
  }

  // ============================================================================
  // Incoming Call UI (Ringing)
  // ============================================================================
  if (localIsIncoming && !isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogTitle className="sr-only">Incoming Call</DialogTitle>
          <div className="text-center py-8">
            <div className="relative inline-block mb-6">
              <Avatar className="h-24 w-24 mx-auto border-4 border-zinc-800">
                <AvatarImage src={participants[0]?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-3xl bg-indigo-600">
                  {participants[0]?.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-6 w-6 bg-green-500 rounded-full border-4 border-zinc-900 animate-pulse"></div>
            </div>

            <h3 className="text-2xl font-bold mb-2">{participants[0]?.displayName}</h3>
            <p className="text-zinc-400 mb-8 animate-pulse">
              {callType === "video" ? "Cuộc gọi video đến..." : "Cuộc gọi thoại đến..."}
            </p>

            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-16 w-16 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all hover:scale-105"
                  onClick={handleDeclineCall}
                >
                  <PhoneOff className="h-8 w-8" />
                </Button>
                <span className="text-xs text-zinc-500 font-medium">Từ chối</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all hover:scale-105 animate-bounce"
                  onClick={handleAcceptCall}
                >
                  <Phone className="h-8 w-8" />
                </Button>
                <span className="text-xs text-zinc-500 font-medium">Nhận cuộc gọi</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ============================================================================
  // Active Call UI
  // ============================================================================
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleEndCall()}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 bg-black border-zinc-800 overflow-hidden">
        <DialogTitle className="sr-only">Video Call</DialogTitle>
        <div className="flex flex-col h-full bg-black text-white">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 backdrop-blur-sm rounded-full border border-zinc-800">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}
                ></div>
                <span className="text-sm font-medium font-mono">{getStatusText()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-10 w-10 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Media Error Banner */}
          {mediaError && (
            <div className="absolute top-16 left-4 right-4 z-20 bg-amber-500/90 backdrop-blur-sm text-black px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm font-medium">{mediaError}</span>
            </div>
          )}

          {/* Video Area */}
          <div className="flex-1 relative bg-zinc-900 overflow-hidden">
            {/* Connection Status Overlay */}
            {!isConnected && !localIsIncoming && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-white/10">
                    <AvatarImage src={participants[0]?.avatar ?? undefined} />
                    <AvatarFallback>{participants[0]?.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-lg font-medium text-white/90">Đang kết nối...</p>
                  <p className="text-sm text-white/50">{participants[0]?.displayName}</p>
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Remote Video (Main) with Speaking Indicator */}
            <div
              className={`w-full h-full relative transition-all duration-300 ${remoteSpeaking && isConnected ? "ring-4 ring-green-500/70 ring-inset" : ""}`}
            >
              <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />

              {/* Remote user not sharing video - show avatar */}
              {!remoteVideoEnabled && isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <div className="text-center">
                    <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-zinc-700">
                      <AvatarImage src={participants[0]?.avatar ?? undefined} />
                      <AvatarFallback className="text-4xl bg-zinc-600">
                        {participants[0]?.displayName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-lg font-medium text-white/70">{participants[0]?.displayName}</p>
                    <p className="text-sm text-white/40">Camera đã tắt</p>
                  </div>
                </div>
              )}

              {/* Remote Speaking indicator */}
              {remoteSpeaking && isConnected && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm rounded-full shadow-lg">
                  <Volume2 className="h-4 w-4 text-white animate-pulse" />
                  <span className="text-sm text-white font-medium">Đang nói</span>
                </div>
              )}

              {/* Remote Muted indicator */}
              {remoteMuted && isConnected && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/80 backdrop-blur-sm rounded-full shadow-lg">
                  <MicOff className="h-4 w-4 text-white" />
                  <span className="text-sm text-white font-medium">Đã tắt mic</span>
                </div>
              )}
            </div>

            {/* Local Video (PiP) with Speaking Border */}
            <div
              className={`absolute top-20 right-4 w-48 aspect-video bg-zinc-800 rounded-xl overflow-hidden shadow-2xl z-30 transition-all hover:scale-105 ${
                localSpeaking && !isMuted ? "ring-4 ring-green-500" : "border-2 border-white/10"
              }`}
            >
              {!isVideoEnabled ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center mx-auto">
                      <VideoOff className="h-6 w-6 text-zinc-500" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">Camera tắt</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  autoPlay
                  playsInline
                  muted
                />
              )}

              {/* Local Video Indicators */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                {isMuted && (
                  <div className="p-1.5 bg-red-500/90 rounded-md backdrop-blur-sm">
                    <MicOff className="h-3 w-3 text-white" />
                  </div>
                )}
                {localSpeaking && !isMuted && (
                  <div className="p-1.5 bg-green-500/90 rounded-md backdrop-blur-sm animate-pulse">
                    <Volume2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* "You" label */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-xs text-white/80">
                Bạn
              </div>
            </div>

            {/* Participant Name Badge */}
            <div className="absolute bottom-24 left-6 z-10">
              <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg text-white font-medium shadow-lg border border-white/5">
                {participants[0]?.displayName}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-6 pb-8 bg-zinc-950 border-t border-zinc-800 z-20">
            <div className="flex items-center justify-center gap-6">
              {/* Mic Toggle */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="lg"
                  variant={isMuted ? "destructive" : "secondary"}
                  className={`rounded-full h-14 w-14 transition-all ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-zinc-800 hover:bg-zinc-700"}`}
                  onClick={toggleAudio}
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
                <span className="text-xs text-zinc-500">{isMuted ? "Bật mic" : "Tắt mic"}</span>
              </div>

              {/* Video Toggle */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="lg"
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  className={`rounded-full h-14 w-14 transition-all ${!isVideoEnabled ? "bg-red-500 hover:bg-red-600" : "bg-zinc-800 hover:bg-zinc-700"}`}
                  onClick={toggleVideo}
                >
                  {!isVideoEnabled ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
                <span className="text-xs text-zinc-500">{isVideoEnabled ? "Tắt video" : "Bật video"}</span>
              </div>

              {/* Screen Share (disabled for now) */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full h-14 w-14 transition-all bg-zinc-800 hover:bg-zinc-700 opacity-50"
                  disabled
                >
                  <Monitor className="h-6 w-6" />
                </Button>
                <span className="text-xs text-zinc-600">Chia sẻ</span>
              </div>

              <div className="w-px h-10 bg-zinc-800 mx-2"></div>

              {/* End Call */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="lg"
                  className="rounded-full h-14 w-20 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 px-0"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <span className="text-xs text-zinc-500">Kết thúc</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
