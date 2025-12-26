"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { initVideoCallSocket, getVideoCallSocket } from "@/lib/socket-video"
import { tokenManager } from "@/lib/auth"
import { api } from "@/lib/api"
import type { User } from "@/types"

// ============================================================================
// Types
// ============================================================================

interface ActiveCall {
  callId: string
  participants: User[]
  callType: "audio" | "video"
  isIncoming: boolean
  isOpen: boolean
}

interface VideoCallContextValue {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  connectionState: RTCPeerConnectionState
  isSocketConnected: boolean

  // Call state
  activeCall: ActiveCall | null
  hasActiveCall: boolean

  // Streams
  localStream: MediaStream | null
  remoteStream: MediaStream | null

  // Device availability
  hasCameraAccess: boolean
  hasMicAccess: boolean
  mediaError: string | null

  // Media controls
  isMuted: boolean
  isVideoEnabled: boolean
  toggleAudio: () => void
  toggleVideo: () => void

  // Remote media state
  remoteMuted: boolean
  remoteVideoEnabled: boolean

  // Speaking indicators
  localSpeaking: boolean
  remoteSpeaking: boolean

  // Call actions
  initiateCall: (targetUser: User, callType: "audio" | "video") => Promise<void>
  acceptIncomingCall: () => Promise<void>
  rejectIncomingCall: () => void
  closeCall: () => void

  // Video refs for UI components
  localVideoRef: React.RefObject<HTMLVideoElement>
  remoteVideoRef: React.RefObject<HTMLVideoElement>
}

const VideoCallContext = createContext<VideoCallContextValue | undefined>(undefined)

export const useVideoCallContext = () => {
  const context = useContext(VideoCallContext)
  if (!context) {
    throw new Error("useVideoCallContext must be used within VideoCallProvider")
  }
  return context
}

interface VideoCallProviderProps {
  children: React.ReactNode
}

// ============================================================================
// Provider Implementation
// ============================================================================

export const VideoCallProvider = ({ children }: VideoCallProviderProps) => {
  // --- Connection State ---
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>("closed")
  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // --- Call State ---
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)

  // --- Streams ---
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // --- Media State ---
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  // --- Remote Media State ---
  const [remoteMuted, setRemoteMuted] = useState(false)
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true)

  // --- Speaking Indicators ---
  const [localSpeaking, setLocalSpeaking] = useState(false)
  const [remoteSpeaking, setRemoteSpeaking] = useState(false)

  // --- Device Availability ---
  const [hasCameraAccess, setHasCameraAccess] = useState(true)
  const [hasMicAccess, setHasMicAccess] = useState(true)
  const [mediaError, setMediaError] = useState<string | null>(null)

  // --- Refs ---
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const targetUserIdRef = useRef<string | null>(null)
  const socketRef = useRef<ReturnType<typeof getVideoCallSocket>>(null)
  const activeCallRef = useRef<ActiveCall | null>(null)

  // Video element refs - exposed to UI components
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // ICE candidates queue for candidates that arrive before remote description
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([])
  const isRemoteDescriptionSet = useRef(false)

  // Track if user is original caller (to prevent callee from sending offer)
  const isOriginalCallerRef = useRef(false)

  // Audio analysis refs for speaking detection
  const audioContextRef = useRef<AudioContext | null>(null)
  const localAnalyserIntervalRef = useRef<number | null>(null)
  const remoteAnalyserIntervalRef = useRef<number | null>(null)

  // Keep activeCallRef in sync
  useEffect(() => {
    activeCallRef.current = activeCall
  }, [activeCall])

  // ============================================================================
  // Audio Analysis for Speaking Detection
  // ============================================================================

  const setupAudioAnalyser = useCallback((stream: MediaStream, isLocal: boolean) => {
    try {
      // Create AudioContext if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }

      const audioCtx = audioContextRef.current
      if (audioCtx.state === "suspended") {
        audioCtx.resume()
      }

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      // Use setInterval instead of requestAnimationFrame for better control
      const intervalId = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray)
        // Calculate RMS (root mean square) for better accuracy
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)
        const isSpeaking = rms > 15 // Threshold for speaking detection

        if (isLocal) {
          setLocalSpeaking(isSpeaking)
        } else {
          setRemoteSpeaking(isSpeaking)
        }
      }, 100) // Check every 100ms

      if (isLocal) {
        localAnalyserIntervalRef.current = intervalId
      } else {
        remoteAnalyserIntervalRef.current = intervalId
      }

      console.log(`[VideoCallProvider] Audio analyser setup for ${isLocal ? "local" : "remote"} stream`)
    } catch (err) {
      console.warn("[VideoCallProvider] Failed to setup audio analyser:", err)
    }
  }, [])

  const cleanupAudioAnalysers = useCallback(() => {
    if (localAnalyserIntervalRef.current) {
      clearInterval(localAnalyserIntervalRef.current)
      localAnalyserIntervalRef.current = null
    }
    if (remoteAnalyserIntervalRef.current) {
      clearInterval(remoteAnalyserIntervalRef.current)
      remoteAnalyserIntervalRef.current = null
    }
    setLocalSpeaking(false)
    setRemoteSpeaking(false)
  }, [])

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const processIceQueue = useCallback(async () => {
    const pc = peerConnectionRef.current
    if (!pc || !isRemoteDescriptionSet.current) return

    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift()
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
          console.log("[VideoCallProvider] Added queued ICE candidate")
        } catch (e) {
          console.error("[VideoCallProvider] Error adding queued ICE candidate", e)
        }
      }
    }
  }, [])

  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      console.log("[VideoCallProvider] Reusing existing local stream")
      return localStreamRef.current
    }

    // Reset error state
    setMediaError(null)

    const videoConstraints = {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      facingMode: "user",
      frameRate: { ideal: 30 },
    }

    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }

    try {
      console.log("[VideoCallProvider] Requesting media with video + audio...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      })

      localStreamRef.current = stream
      setLocalStream(stream)
      setHasCameraAccess(true)
      setHasMicAccess(true)

      // Setup audio analyser for speaking detection
      setupAudioAnalyser(stream, true)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch((e) => console.warn("[VideoCallProvider] Local video play failed:", e))
      }

      console.log("[VideoCallProvider] Local stream acquired (video + audio)")
      return stream
    } catch (err) {
      console.error("[VideoCallProvider] Failed to get video+audio", err)
      setHasCameraAccess(false)

      // Try audio only
      try {
        console.log("[VideoCallProvider] Falling back to audio only...")
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: audioConstraints,
        })

        localStreamRef.current = audioStream
        setLocalStream(audioStream)
        setIsVideoEnabled(false)
        setHasMicAccess(true)
        setMediaError("Camera không khả dụng. Chỉ sử dụng audio.")

        setupAudioAnalyser(audioStream, true)

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = audioStream
        }

        console.log("[VideoCallProvider] Local stream acquired (audio only)")
        return audioStream
      } catch (audioErr) {
        console.error("[VideoCallProvider] Could not access any media device", audioErr)
        setHasMicAccess(false)
        setMediaError("Không thể truy cập camera hoặc microphone. Vui lòng kiểm tra quyền truy cập.")
        throw new Error("Could not access camera or microphone")
      }
    }
  }, [setupAudioAnalyser])

  const createPeerConnection = useCallback(
    async (callId: string) => {
      if (peerConnectionRef.current) return peerConnectionRef.current

      try {
        let iceServers = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }]

        try {
          const stunConfig = await api.getStunConfig()
          if (stunConfig?.stunServers) iceServers = stunConfig.stunServers
        } catch {
          console.warn("[VideoCallProvider] Using default STUN servers")
        }

        const pc = new RTCPeerConnection({
          iceServers,
          iceTransportPolicy: "all",
          bundlePolicy: "max-bundle",
          rtcpMuxPolicy: "require",
        })

        // ICE Candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current && targetUserIdRef.current) {
            socketRef.current.emit("ice_candidate", {
              callId,
              targetUserId: targetUserIdRef.current,
              candidate: event.candidate.toJSON(),
            })
          }
        }

        // ICE Gathering State
        pc.onicegatheringstatechange = () => {
          console.log("[VideoCallProvider] ICE gathering state:", pc.iceGatheringState)
        }

        // Connection State
        pc.onconnectionstatechange = () => {
          console.log("[VideoCallProvider] Connection state:", pc.connectionState)
          setConnectionState(pc.connectionState)

          if (pc.connectionState === "connected") {
            setIsConnected(true)
            setIsConnecting(false)
          } else if (pc.connectionState === "failed") {
            console.log("[VideoCallProvider] Connection failed, attempting ICE restart...")
            setIsConnected(false)
            pc.restartIce()
          } else if (pc.connectionState === "disconnected") {
            setIsConnected(false)
          } else if (pc.connectionState === "closed") {
            setIsConnected(false)
            setIsConnecting(false)
          }
        }

        // ICE Connection State (more granular than connection state)
        pc.oniceconnectionstatechange = () => {
          console.log("[VideoCallProvider] ICE connection state:", pc.iceConnectionState)
          if (pc.iceConnectionState === "failed") {
            console.log("[VideoCallProvider] ICE failed, attempting restart...")
            pc.restartIce()
          }
        }

        // Remote Stream - Critical for receiving video/audio
        pc.ontrack = (event) => {
          console.log(
            "[VideoCallProvider] Received remote track:",
            event.track.kind,
            "readyState:",
            event.track.readyState
          )

          if (event.streams && event.streams[0]) {
            const remoteMediaStream = event.streams[0]
            console.log(
              "[VideoCallProvider] Remote stream tracks:",
              remoteMediaStream.getTracks().map((t) => `${t.kind}:${t.enabled}`)
            )

            setRemoteStream(remoteMediaStream)

            // Setup audio analyser for remote speaking detection
            setupAudioAnalyser(remoteMediaStream, false)

            // Ensure video element is updated
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteMediaStream

              // Handle autoplay policy - try to play
              const playPromise = remoteVideoRef.current.play()
              if (playPromise !== undefined) {
                playPromise.catch((e) => {
                  console.warn("[VideoCallProvider] Remote video autoplay blocked:", e)
                  // User interaction might be needed
                })
              }
            }

            // Monitor track state changes for UI feedback
            event.track.onended = () => {
              console.log("[VideoCallProvider] Remote track ended:", event.track.kind)
            }

            event.track.onmute = () => {
              console.log("[VideoCallProvider] Remote track muted:", event.track.kind)
              if (event.track.kind === "audio") setRemoteMuted(true)
              if (event.track.kind === "video") setRemoteVideoEnabled(false)
            }

            event.track.onunmute = () => {
              console.log("[VideoCallProvider] Remote track unmuted:", event.track.kind)
              if (event.track.kind === "audio") setRemoteMuted(false)
              if (event.track.kind === "video") setRemoteVideoEnabled(true)
            }
          }
        }

        peerConnectionRef.current = pc
        console.log("[VideoCallProvider] PeerConnection created")
        return pc
      } catch (err) {
        console.error("[VideoCallProvider] Failed to create PeerConnection", err)
        throw err
      }
    },
    [setupAudioAnalyser]
  )

  const addTracksToPC = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      const senders = pc.getSenders()
      const alreadyAdded = senders.some((s) => s.track === track)
      if (!alreadyAdded) {
        console.log("[VideoCallProvider] Adding track to PC:", track.kind)
        pc.addTrack(track, stream)
      }
    })
  }, [])

  const cleanupCall = useCallback(() => {
    console.log("[VideoCallProvider] Cleaning up call...")

    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        t.stop()
        console.log("[VideoCallProvider] Stopped track:", t.kind)
      })
      localStreamRef.current = null
      setLocalStream(null)
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    // Cleanup audio analysers
    cleanupAudioAnalysers()

    // Reset all states
    setIsConnected(false)
    setIsConnecting(false)
    setConnectionState("closed")
    setRemoteStream(null)
    setIsMuted(false)
    setIsVideoEnabled(true)
    setRemoteMuted(false)
    setRemoteVideoEnabled(true)
    isRemoteDescriptionSet.current = false
    iceCandidatesQueue.current = []
    targetUserIdRef.current = null
    isOriginalCallerRef.current = false

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }, [cleanupAudioAnalysers])

  // ============================================================================
  // Socket Event Handlers
  // ============================================================================

  // Helper to ensure socket is connected before emitting
  const ensureSocketConnected = useCallback(async (): Promise<boolean> => {
    const socket = socketRef.current
    if (!socket) {
      console.warn("[VideoCallProvider] Socket not initialized, attempting to init...")
      const token = tokenManager.getToken()
      if (token) {
        const newSocket = initVideoCallSocket(token)
        if (newSocket) {
          socketRef.current = newSocket
          // Wait for connection
          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.error("[VideoCallProvider] Socket connection timeout")
              resolve(false)
            }, 5000)

            newSocket.once("connect", () => {
              clearTimeout(timeout)
              setIsSocketConnected(true)
              resolve(true)
            })

            newSocket.once("connect_error", () => {
              clearTimeout(timeout)
              resolve(false)
            })
          })
        }
      }
      return false
    }

    if (!socket.connected) {
      console.warn("[VideoCallProvider] Socket not connected, waiting...")
      socket.connect()

      // Wait for connection with timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error("[VideoCallProvider] Socket reconnection timeout")
          resolve(false)
        }, 5000)

        socket.once("connect", () => {
          clearTimeout(timeout)
          setIsSocketConnected(true)
          resolve(true)
        })

        socket.once("connect_error", () => {
          clearTimeout(timeout)
          resolve(false)
        })
      })
    }

    return true
  }, [])

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    let retryTimeout: NodeJS.Timeout | null = null
    let mounted = true

    const initSocket = () => {
      const token = tokenManager.getToken()
      const user = tokenManager.getUser()

      if (!token || !user) {
        console.log("[VideoCallProvider] Waiting for authentication...")
        // Retry after 1 second
        retryTimeout = setTimeout(() => {
          if (mounted) initSocket()
        }, 1000)
        return
      }

      console.log("[VideoCallProvider] Initializing socket for user:", user.id)
      const socket = initVideoCallSocket(token)
      socketRef.current = socket

      if (!socket) {
        console.error("[VideoCallProvider] Failed to init socket")
        // Retry after 2 seconds
        retryTimeout = setTimeout(() => {
          if (mounted) initSocket()
        }, 2000)
        return
      }

      // --- Connection Events ---
      const handleConnect = () => {
        console.log("[VideoCallProvider] ✅ Socket connected, id:", socket.id)
        setIsSocketConnected(true)
      }

      const handleDisconnect = (reason: string) => {
        console.log("[VideoCallProvider] ❌ Socket disconnected:", reason)
        setIsSocketConnected(false)
      }

      const handleConnectError = (error: Error) => {
        console.error("[VideoCallProvider] Socket connection error:", error.message)
        setIsSocketConnected(false)
      }

      // --- Incoming Call ---
      const handleCallInvite = async (data: { callId: string; fromUserId: string }) => {
        console.log("[VideoCallProvider] 📞 Incoming call from:", data.fromUserId)

        // Don't override if already in a call
        if (activeCallRef.current?.isOpen) {
          console.log("[VideoCallProvider] Already in a call, ignoring")
          return
        }

        try {
          const caller = await api.getUser(data.fromUserId)
          if (caller) {
            setActiveCall({
              callId: data.callId,
              participants: [caller],
              callType: "video",
              isIncoming: true,
              isOpen: true,
            })
            isOriginalCallerRef.current = false
          }
        } catch (error) {
          console.error("[VideoCallProvider] Failed to fetch caller info:", error)
        }
      }

      // --- Offer Received (Callee) ---
      const handleOffer = async (data: { offer: RTCSessionDescriptionInit; fromUserId: string; callId: string }) => {
        console.log("[VideoCallProvider] Received offer from:", data.fromUserId)
        try {
          targetUserIdRef.current = data.fromUserId
          const pc = await createPeerConnection(data.callId)
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
          isRemoteDescriptionSet.current = true
          await processIceQueue()
        } catch (err) {
          console.error("[VideoCallProvider] Error handling offer", err)
        }
      }

      // --- Answer Received (Caller) ---
      const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
        console.log("[VideoCallProvider] Received answer")
        try {
          const pc = peerConnectionRef.current
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
            isRemoteDescriptionSet.current = true
            await processIceQueue()
          }
        } catch (err) {
          console.error("[VideoCallProvider] Error handling answer", err)
        }
      }

      // --- ICE Candidate ---
      const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
        try {
          const pc = peerConnectionRef.current
          if (pc && pc.remoteDescription && isRemoteDescriptionSet.current) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
          } else {
            iceCandidatesQueue.current.push(data.candidate)
          }
        } catch (err) {
          console.error("[VideoCallProvider] Error handling ICE candidate", err)
        }
      }

      // --- Call Ended ---
      const handleCallEnded = () => {
        console.log("[VideoCallProvider] Call ended by remote")
        cleanupCall()
        setActiveCall(null)
      }

      const handleCallRejected = () => {
        console.log("[VideoCallProvider] Call rejected")
        cleanupCall()
        setActiveCall(null)
      }

      // --- Remote Media Toggle Events ---
      const handleRemoteAudioToggled = (data: { userId: string; enabled: boolean }) => {
        console.log("[VideoCallProvider] Remote audio toggled:", data.enabled)
        setRemoteMuted(!data.enabled)
      }

      const handleRemoteVideoToggled = (data: { userId: string; enabled: boolean }) => {
        console.log("[VideoCallProvider] Remote video toggled:", data.enabled)
        setRemoteVideoEnabled(data.enabled)
      }

      socket.on("connect", handleConnect)
      socket.on("disconnect", handleDisconnect)
      socket.on("connect_error", handleConnectError)
      socket.on("call_invite_received", handleCallInvite)
      socket.on("offer", handleOffer)
      socket.on("answer", handleAnswer)
      socket.on("ice_candidate", handleIceCandidate)
      socket.on("call_ended", handleCallEnded)
      socket.on("call_rejected", handleCallRejected)
      socket.on("audio_toggled", handleRemoteAudioToggled)
      socket.on("video_toggled", handleRemoteVideoToggled)

      // Check if already connected
      if (socket.connected) {
        setIsSocketConnected(true)
      }
    }

    initSocket()

    return () => {
      mounted = false
      if (retryTimeout) clearTimeout(retryTimeout)
      const socket = socketRef.current
      if (socket) {
        socket.off("connect")
        socket.off("disconnect")
        socket.off("connect_error")
        socket.off("call_invite_received")
        socket.off("offer")
        socket.off("answer")
        socket.off("ice_candidate")
        socket.off("call_ended")
        socket.off("call_rejected")
        socket.off("audio_toggled")
        socket.off("video_toggled")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================================================
  // Call Actions
  // ============================================================================

  const initiateCall = useCallback(
    async (targetUser: User, callType: "audio" | "video") => {
      try {
        if (activeCallRef.current?.isOpen) {
          console.log("[VideoCallProvider] Already in a call")
          return
        }

        setIsConnecting(true)
        isOriginalCallerRef.current = true

        // Create call via API
        const call = await api.createVideoCall({
          participantIds: [targetUser.id],
          title: `Cuộc gọi ${callType === "video" ? "video" : "thoại"}`,
          maxParticipants: 2,
        })

        await api.startVideoCall(call.id)

        setActiveCall({
          callId: call.id,
          participants: [targetUser],
          callType,
          isIncoming: false,
          isOpen: true,
        })

        targetUserIdRef.current = targetUser.id

        // Validate socket connection before sending (wait up to 5s)
        const socketConnected = await ensureSocketConnected()
        if (!socketConnected) {
          throw new Error("Không thể kết nối socket. Vui lòng thử lại.")
        }

        const socket = socketRef.current!

        // Notify target user
        console.log("[VideoCallProvider] 📞 Sending call_invite to:", targetUser.id, "via socket:", socket.id)
        socket.emit("call_invite", {
          callId: call.id,
          targetUserId: targetUser.id,
        })

        // Join call room
        socket.emit("join_call_room", { callId: call.id })

        // Get local stream and create offer
        const stream = await getLocalStream()
        const pc = await createPeerConnection(call.id)
        addTracksToPC(pc, stream)

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
        await pc.setLocalDescription(offer)

        console.log("[VideoCallProvider] Sending offer to:", targetUser.id)
        socketRef.current?.emit("offer", {
          callId: call.id,
          targetUserId: targetUser.id,
          offer,
        })
      } catch (error) {
        console.error("[VideoCallProvider] Failed to initiate call:", error)
        setIsConnecting(false)
        throw error
      }
    },
    [getLocalStream, createPeerConnection, addTracksToPC]
  )

  const acceptIncomingCall = useCallback(async () => {
    if (!activeCallRef.current) return

    const currentCall = activeCallRef.current

    try {
      setIsConnecting(true)

      // Join call room
      socketRef.current?.emit("join_call_room", { callId: currentCall.callId })

      // Emit accept event
      socketRef.current?.emit("call_accept", { callId: currentCall.callId })

      // Get local stream FIRST - this is critical
      console.log("[VideoCallProvider] Callee: Getting local stream...")
      const stream = await getLocalStream()

      // Create/get peer connection
      const pc = await createPeerConnection(currentCall.callId)

      // Add tracks to connection
      addTracksToPC(pc, stream)

      // Wait for remote description (offer should have been received)
      const maxWait = 10000 // Increased to 10 seconds
      const checkInterval = 100
      let waited = 0

      while (!isRemoteDescriptionSet.current && waited < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval))
        waited += checkInterval
      }

      if (!isRemoteDescriptionSet.current) {
        throw new Error("Offer not received in time")
      }

      // Create and send answer
      console.log("[VideoCallProvider] Callee: Creating answer...")
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      socketRef.current?.emit("answer", {
        callId: currentCall.callId,
        targetUserId: targetUserIdRef.current,
        answer,
      })

      await processIceQueue()

      // Update state - no longer incoming
      setActiveCall((prev) => (prev ? { ...prev, isIncoming: false } : null))
    } catch (error) {
      console.error("[VideoCallProvider] Failed to accept call:", error)
      setIsConnecting(false)
    }
  }, [getLocalStream, createPeerConnection, addTracksToPC, processIceQueue])

  const rejectIncomingCall = useCallback(() => {
    if (activeCallRef.current) {
      socketRef.current?.emit("call_reject", { callId: activeCallRef.current.callId })
    }
    cleanupCall()
    setActiveCall(null)
  }, [cleanupCall])

  const closeCall = useCallback(() => {
    if (activeCallRef.current) {
      socketRef.current?.emit("call_end", { callId: activeCallRef.current.callId })
      socketRef.current?.emit("leave_call_room", { callId: activeCallRef.current.callId })
    }
    cleanupCall()
    setActiveCall(null)
  }, [cleanupCall])

  // ============================================================================
  // Media Controls
  // ============================================================================

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) {
      console.warn("[VideoCallProvider] No local stream to toggle audio")
      return
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      console.warn("[VideoCallProvider] No audio tracks found")
      return
    }

    const newMutedState = !isMuted
    audioTracks.forEach((t) => {
      t.enabled = !newMutedState
      console.log(`[VideoCallProvider] Audio track ${t.id} enabled:`, t.enabled)
    })
    setIsMuted(newMutedState)

    // Notify remote peer via socket
    if (activeCallRef.current && socketRef.current) {
      socketRef.current.emit("toggle_audio", {
        callId: activeCallRef.current.callId,
        enabled: !newMutedState,
      })
    }
  }, [isMuted])

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) {
      console.warn("[VideoCallProvider] No local stream to toggle video")
      return
    }

    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0) {
      console.warn("[VideoCallProvider] No video tracks found")
      return
    }

    const newVideoState = !isVideoEnabled
    videoTracks.forEach((t) => {
      t.enabled = newVideoState
      console.log(`[VideoCallProvider] Video track ${t.id} enabled:`, t.enabled)
    })
    setIsVideoEnabled(newVideoState)

    // Notify remote peer via socket
    if (activeCallRef.current && socketRef.current) {
      socketRef.current.emit("toggle_video", {
        callId: activeCallRef.current.callId,
        enabled: newVideoState,
      })
    }
  }, [isVideoEnabled])

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: VideoCallContextValue = {
    isConnected,
    isConnecting,
    connectionState,
    isSocketConnected,
    activeCall,
    hasActiveCall: activeCall?.isOpen ?? false,
    localStream,
    remoteStream,
    hasCameraAccess,
    hasMicAccess,
    mediaError,
    isMuted,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    remoteMuted,
    remoteVideoEnabled,
    localSpeaking,
    remoteSpeaking,
    initiateCall,
    acceptIncomingCall,
    rejectIncomingCall,
    closeCall,
    localVideoRef,
    remoteVideoRef,
  }

  return <VideoCallContext.Provider value={value}>{children}</VideoCallContext.Provider>
}
