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

let socket: Socket | null = null

// Client -> Server events
export interface VideoCallSocketClientEvents {
  join_call_room: (data: { callId: string }) => void
  leave_call_room: (data: { callId: string }) => void
  call_invite: (data: { callId: string; targetUserId: string }) => void
  call_accept: (data: { callId: string }) => void
  call_reject: (data: { callId: string }) => void
  offer: (data: { callId: string; targetUserId: string; offer: RTCSessionDescriptionInit }) => void
  answer: (data: { callId: string; targetUserId: string; answer: RTCSessionDescriptionInit }) => void
  ice_candidate: (data: { callId: string; targetUserId: string; candidate: RTCIceCandidateInit }) => void
  call_end: (data: { callId: string }) => void
  toggle_audio: (data: { callId: string; enabled: boolean }) => void
  toggle_video: (data: { callId: string; enabled: boolean }) => void
}

// Server -> Client events
export interface VideoCallSocketServerEvents {
  joined_call_room: (data: { callId: string; roomId: string; timestamp: Date }) => void
  left_call_room: (data: { callId: string; roomId: string; timestamp: Date }) => void
  participant_joined: (data: { callId: string; userId: string; roomId: string; timestamp: Date }) => void
  participant_left: (data: { callId: string; userId: string; roomId: string; timestamp: Date }) => void
  call_invite_received: (data: { callId: string; fromUserId: string; timestamp: Date }) => void
  call_accepted: (data: { callId: string; userId: string; roomId: string; timestamp: Date }) => void
  call_rejected: (data: { callId: string; userId: string; roomId: string; timestamp: Date }) => void
  call_ended: (data: { callId: string; endedBy: string; roomId: string; timestamp: Date }) => void
  offer: (data: { callId: string; fromUserId: string; offer: RTCSessionDescriptionInit; timestamp: Date }) => void
  answer: (data: { callId: string; fromUserId: string; answer: RTCSessionDescriptionInit; timestamp: Date }) => void
  ice_candidate: (data: { callId: string; fromUserId: string; candidate: RTCIceCandidateInit; timestamp: Date }) => void
  audio_toggled: (data: { callId: string; userId: string; enabled: boolean; timestamp: Date }) => void
  video_toggled: (data: { callId: string; userId: string; enabled: boolean; timestamp: Date }) => void
  error: (error: { event: string; message: string }) => void
}

// Combined interface for Socket.IO typing
// Note: answer, offer, and ice_candidate exist in both client and server events with different signatures
// We use server event signatures (with fromUserId) for socket.on() typing
// Client events (with targetUserId) are used for socket.emit() typing separately
export type VideoCallSocketEvents = VideoCallSocketServerEvents &
  Omit<VideoCallSocketClientEvents, "offer" | "answer" | "ice_candidate">

/**
 * Khởi tạo socket connection cho video calls
 */
export const initVideoCallSocket = (token?: string): Socket | null => {
  // Use existing connected socket
  if (socket && socket.connected) {
    return socket
  }

  // Force new token check
  const authToken = token || tokenManager.getToken()

  if (!authToken) {
    console.warn("⚠️ Cannot init video socket: No token available")
    return null
  }

  // If socket exists but disconnected, try to reconnect with new token
  if (socket) {
    socket.auth = { token: authToken }
    socket.connect()
    return socket
  }

  // Create new socket
  socket = io(`${SOCKET_URL}/video-calls`, {
    auth: {
      token: authToken,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  })

  socket.on("connect", () => {
    console.log("✅ Video call socket connected:", socket?.id)
  })

  socket.on("disconnect", (reason) => {
    console.log("❌ Video call socket disconnected:", reason)
  })

  socket.on("connect_error", (error) => {
    console.error("❌ Video call socket connection error:", error.message)
  })

  return socket
}

/**
 * Lấy socket instance hiện tại
 */
export const getVideoCallSocket = (): Socket | null => {
  return socket
}

/**
 * Disconnect socket
 */
export const disconnectVideoCallSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
