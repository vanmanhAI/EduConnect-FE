"use client"

import { io, Socket } from "socket.io-client"
import { tokenManager } from "@/lib/auth"

const getSocketUrl = (): string => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
  if (socketUrl) {
    return socketUrl.replace(/\/$/, "")
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE
  if (apiBase) {
    return apiBase.replace("/api/v1", "").replace(/\/$/, "")
  }

  return "http://localhost:3001"
}

const SOCKET_URL = getSocketUrl()

let videoSocket: Socket | null = null

export interface VideoSocketEvents {
  // Server -> Client
  incoming_call: (data: {
    callId: string
    roomId: string
    caller: {
      id: string
      displayName?: string
      avatar?: string
    }
    callType: "1-1" | "group"
    startTime: string
  }) => void

  // Client -> Server (if any, e.g. accept_call signaling?)
  // For now LiveKit handles the actual call, but we might send 'accept' status to DB via API
}

export const initVideoSocket = (token?: string): Socket | null => {
  if (videoSocket && videoSocket.connected) {
    return videoSocket
  }

  if (videoSocket && !videoSocket.connected) {
    videoSocket.disconnect()
  }

  const authToken = token || tokenManager.getToken()

  if (!authToken) {
    return null
  }

  videoSocket = io(`${SOCKET_URL}/video-calls`, {
    auth: {
      token: authToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
  })

  videoSocket.on("connect", () => {
    console.log("📹 Video Socket connected:", videoSocket?.id)
  })

  videoSocket.on("connect_error", (err) => {
    console.error("📹 Video Socket connection error:", err.message)
  })

  videoSocket.on("disconnect", (reason) => {
    console.log("📹 Video Socket disconnected:", reason)
  })

  return videoSocket
}

export const getVideoSocket = (): Socket | null => {
  return videoSocket
}

export const disconnectVideoSocket = () => {
  if (videoSocket) {
    videoSocket.disconnect()
    videoSocket = null
  }
}

export const onVideoEvent = <K extends keyof VideoSocketEvents>(event: K, callback: VideoSocketEvents[K]) => {
  if (!videoSocket) {
    return () => {}
  }

  videoSocket.on(event as string, callback as any)

  return () => {
    if (videoSocket) {
      videoSocket.off(event as string, callback as any)
    }
  }
}
