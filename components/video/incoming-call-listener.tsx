"use client"

import { useEffect, useState } from "react"
import { initVideoSocket, onVideoEvent, disconnectVideoSocket } from "@/lib/socket-video"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, PhoneOff, Video } from "lucide-react"
import { useRouter } from "next/navigation"

interface IncomingCallData {
  callId: string
  roomId: string
  caller: {
    id: string
    displayName?: string
    avatar?: string
  }
  callType: "1-1" | "group"
  group?: {
    id: string
    name: string
    avatar?: string
  }
}

export function IncomingCallListener() {
  const { user } = useAuth()
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null)
  const router = useRouter()
  // Audio for ringtone
  const [audio] = useState<HTMLAudioElement | null>(
    typeof Audio !== "undefined" ? new Audio("/sounds/ringtone.mp3") : null
  )

  useEffect(() => {
    if (!user) return

    // Initialize socket
    initVideoSocket()

    // Listen for incoming call
    const cleanup = onVideoEvent("incoming_call", (data) => {
      console.log("📞 Incoming call:", data)
      if (data.caller.id !== user.id) {
        setIncomingCall(data)
        // Play ringtone
        if (audio) {
          audio.loop = true
          audio.play().catch((e) => console.error("Error playing ringtone:", e))
        }
      }
    })

    return () => {
      cleanup()
      disconnectVideoSocket()
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [user, audio])

  const handleAccept = () => {
    if (incomingCall) {
      // Stop ringtone
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }

      // Navigate to call page with callId to auto-join

      router.push(`/chat?callId=${incomingCall.callId}&accepted=true`)
      setIncomingCall(null)
    }
  }

  const handleDecline = () => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIncomingCall(null)
    // Optionally emit 'reject_call' event
  }

  if (!incomingCall) return null

  const isGroupCall = incomingCall.callType === "group"
  const displayAvatar = isGroupCall && incomingCall.group ? incomingCall.group.avatar : incomingCall.caller.avatar
  const displayName =
    isGroupCall && incomingCall.group
      ? incomingCall.group.name
      : incomingCall.caller.displayName || "Người dùng ẩn danh"
  const subText = isGroupCall
    ? `${incomingCall.caller.displayName || "Thành viên"} đang mời bạn tham gia...`
    : "đang gọi cho bạn..."

  return (
    <Dialog open={!!incomingCall} onOpenChange={(open) => !open && handleDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{isGroupCall ? "Cuộc gọi nhóm" : "Cuộc gọi video"}</DialogTitle>
          <DialogDescription className="text-center">
            {isGroupCall && incomingCall.group?.name ? incomingCall.group.name : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src={displayAvatar} />
            <AvatarFallback className="text-2xl">{displayName?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{subText}</p>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-center space-x-4 sm:justify-center">
          <Button variant="destructive" size="lg" className="h-14 w-14 rounded-full p-0" onClick={handleDecline}>
            <PhoneOff className="h-6 w-6" />
            <span className="sr-only">Từ chối</span>
          </Button>
          <Button
            variant="default"
            size="lg"
            className="h-14 w-14 rounded-full p-0 bg-green-600 hover:bg-green-700"
            onClick={handleAccept}
          >
            <Video className="h-6 w-6" />
            <span className="sr-only">Trả lời</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
