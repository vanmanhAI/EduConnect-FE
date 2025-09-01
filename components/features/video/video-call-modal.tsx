"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  PhoneOff,
  Monitor,
  Settings,
  Users,
  MessageSquare,
  MoreVertical,
} from "lucide-react"
import type { User } from "@/types"

interface VideoCallModalProps {
  isOpen: boolean
  onClose: () => void
  participants: User[]
  callType: "audio" | "video"
  isIncoming?: boolean
}

export function VideoCallModal({ isOpen, onClose, participants, callType, isIncoming = false }: VideoCallModalProps) {
  const [isConnected, setIsConnected] = useState(!isIncoming)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === "video")
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [showParticipants, setShowParticipants] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isConnected])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAcceptCall = () => {
    setIsConnected(true)
  }

  const handleDeclineCall = () => {
    onClose()
  }

  const handleEndCall = () => {
    onClose()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled)
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
  }

  if (isIncoming && !isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarImage src={participants[0]?.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">{participants[0]?.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold mb-2">{participants[0]?.displayName}</h3>
            <p className="text-muted-foreground mb-6">
              {callType === "video" ? "Cuộc gọi video đến..." : "Cuộc gọi thoại đến..."}
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="destructive" className="rounded-full h-14 w-14" onClick={handleDeclineCall}>
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
                onClick={handleAcceptCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="flex flex-col h-full bg-black text-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {formatDuration(callDuration)}
              </Badge>
              <span className="text-sm">{participants.map((p) => p.displayName).join(", ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video Area */}
          <div className="flex-1 relative">
            {callType === "video" && isVideoEnabled ? (
              <div className="h-full relative">
                {/* Remote Video */}
                <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />

                {/* Local Video */}
                <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                  <video ref={localVideoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                </div>

                {/* Participant Info Overlay */}
                <div className="absolute bottom-20 left-4">
                  <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participants[0]?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{participants[0]?.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{participants[0]?.displayName}</span>
                    {!isMuted && <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={participants[0]?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-4xl">{participants[0]?.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-semibold mb-2">{participants[0]?.displayName}</h3>
                  <p className="text-white/70">{callType === "audio" ? "Cuộc gọi thoại" : "Camera đã tắt"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 bg-black/50">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full h-12 w-12"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              {callType === "video" && (
                <Button
                  size="lg"
                  variant={!isVideoEnabled ? "destructive" : "secondary"}
                  className="rounded-full h-12 w-12"
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
              )}

              <Button
                size="lg"
                variant={isScreenSharing ? "default" : "secondary"}
                className="rounded-full h-12 w-12"
                onClick={toggleScreenShare}
              >
                <Monitor className="h-5 w-5" />
              </Button>

              <Button size="lg" variant="secondary" className="rounded-full h-12 w-12">
                <Settings className="h-5 w-5" />
              </Button>

              <Button size="lg" variant="destructive" className="rounded-full h-12 w-12" onClick={handleEndCall}>
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
