"use client"

import { useCallback, useRef } from "react"

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MediaStreamOptions {
  video?: boolean | MediaTrackConstraints
  audio?: boolean | MediaTrackConstraints
  preferVideo?: boolean // Nếu false, ưu tiên audio-only nếu video fail
}

export interface DevicePreferences {
  videoDeviceId?: string
  audioDeviceId?: string
}

export interface MediaState {
  hasCameraAccess: boolean
  hasMicAccess: boolean
  isMuted: boolean
  isVideoEnabled: boolean
}

// ============================================================================
// Media Manager Hook
// ============================================================================

export const useMediaManager = () => {
  const streamRef = useRef<MediaStream | null>(null)

  // ============================================================================
  // Device Management
  // ============================================================================

  /**
   * Lấy danh sách tất cả media devices
   */
  const enumerateDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
    } catch (err) {
      console.error("[MediaManager] Failed to enumerate devices:", err)
      return []
    }
  }, [])

  /**
   * Kiểm tra device availability thực tế
   */
  const checkDeviceAvailability = useCallback(async (): Promise<{
    hasCamera: boolean
    hasMic: boolean
  }> => {
    try {
      const devices = await enumerateDevices()
      const hasVideoInput = devices.some((d) => d.kind === "videoinput")
      const hasAudioInput = devices.some((d) => d.kind === "audioinput")

      // Thử request permissions để có thông tin chính xác hơn
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: hasVideoInput,
          audio: hasAudioInput,
        })
        stream.getTracks().forEach((track) => track.stop())
      } catch {
        // Ignore permission errors, chỉ cần check device existence
      }

      return {
        hasCamera: hasVideoInput,
        hasMic: hasAudioInput,
      }
    } catch (err) {
      console.error("[MediaManager] Failed to check device availability:", err)
      return { hasCamera: false, hasMic: false }
    }
  }, [enumerateDevices])

  /**
   * Lấy device preferences từ localStorage
   */
  const getDevicePreferences = useCallback((): DevicePreferences => {
    try {
      const stored = localStorage.getItem("mediaDevicePreferences")
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (err) {
      console.warn("[MediaManager] Failed to load device preferences:", err)
    }
    return {}
  }, [])

  /**
   * Lưu device preferences vào localStorage
   */
  const saveDevicePreferences = useCallback((prefs: DevicePreferences) => {
    try {
      localStorage.setItem("mediaDevicePreferences", JSON.stringify(prefs))
    } catch (err) {
      console.warn("[MediaManager] Failed to save device preferences:", err)
    }
  }, [])

  // ============================================================================
  // Constraints Helpers
  // ============================================================================

  /**
   * Tạo video constraints với preferences
   */
  const createVideoConstraints = useCallback((prefs?: DevicePreferences): MediaTrackConstraints => {
    const baseConstraints: MediaTrackConstraints = {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      facingMode: "user",
      frameRate: { ideal: 30 },
    }

    if (prefs?.videoDeviceId) {
      baseConstraints.deviceId = { exact: prefs.videoDeviceId }
    }

    return baseConstraints
  }, [])

  /**
   * Tạo audio constraints với preferences
   */
  const createAudioConstraints = useCallback((prefs?: DevicePreferences): MediaTrackConstraints => {
    const baseConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }

    if (prefs?.audioDeviceId) {
      baseConstraints.deviceId = { exact: prefs.audioDeviceId }
    }

    return baseConstraints
  }, [])

  // ============================================================================
  // Stream Management
  // ============================================================================

  /**
   * Tạo media stream với fallback logic
   */
  const getMediaStream = useCallback(
    async (
      options: MediaStreamOptions = {}
    ): Promise<{
      stream: MediaStream
      state: MediaState
      error?: string
    }> => {
      const prefs = getDevicePreferences()
      const preferVideo = options.preferVideo !== false

      // Default: video + audio
      const videoConstraints = options.video ?? (preferVideo ? createVideoConstraints(prefs) : false)
      const audioConstraints = options.audio ?? createAudioConstraints(prefs)

      // Try video + audio first
      if (preferVideo && videoConstraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          })

          streamRef.current = stream

          const audioTracks = stream.getAudioTracks()
          const videoTracks = stream.getVideoTracks()
          const state: MediaState = {
            hasCameraAccess: videoTracks.length > 0,
            hasMicAccess: audioTracks.length > 0,
            isMuted: audioTracks.length > 0 ? !audioTracks[0].enabled : true,
            isVideoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
          }

          console.log("[MediaManager] Stream acquired (video + audio)")
          return { stream, state }
        } catch (err) {
          console.warn("[MediaManager] Failed to get video+audio, trying audio only:", err)
        }
      }

      // Fallback: audio only
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: audioConstraints,
        })

        streamRef.current = stream

        const audioTracks = stream.getAudioTracks()
        const state: MediaState = {
          hasCameraAccess: false,
          hasMicAccess: audioTracks.length > 0,
          isMuted: audioTracks.length > 0 ? !audioTracks[0].enabled : true,
          isVideoEnabled: false,
        }

        console.log("[MediaManager] Stream acquired (audio only)")
        return {
          stream,
          state,
          error: "Camera không khả dụng. Chỉ sử dụng audio.",
        }
      } catch (err) {
        console.error("[MediaManager] Failed to get any media:", err)
        const errorMessage = handleMediaError(err as Error)
        throw new Error(errorMessage)
      }
    },
    [getDevicePreferences, createVideoConstraints, createAudioConstraints]
  )

  /**
   * Cleanup stream và stop tất cả tracks
   */
  const cleanupStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return

    stream.getTracks().forEach((track) => {
      track.stop()
      console.log("[MediaManager] Stopped track:", track.kind)
    })

    if (streamRef.current === stream) {
      streamRef.current = null
    }
  }, [])

  // ============================================================================
  // Track Management
  // ============================================================================

  /**
   * Update track enabled state
   */
  const updateTrackEnabled = useCallback((stream: MediaStream, kind: "audio" | "video", enabled: boolean): boolean => {
    const tracks = kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks()

    if (tracks.length === 0) {
      console.warn(`[MediaManager] No ${kind} tracks found`)
      return false
    }

    tracks.forEach((track) => {
      track.enabled = enabled
      console.log(`[MediaManager] ${kind} track ${track.id} enabled:`, enabled)
    })

    return true
  }, [])

  /**
   * Sync state từ stream tracks
   */
  const syncTrackState = useCallback((stream: MediaStream | null): MediaState | null => {
    if (!stream) return null

    const audioTracks = stream.getAudioTracks()
    const videoTracks = stream.getVideoTracks()

    return {
      hasCameraAccess: videoTracks.length > 0,
      hasMicAccess: audioTracks.length > 0,
      isMuted: audioTracks.length > 0 ? !audioTracks[0].enabled : true,
      isVideoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
    }
  }, [])

  /**
   * Lấy current track state
   */
  const getTrackState = useCallback(
    (stream: MediaStream | null): MediaState | null => {
      return syncTrackState(stream)
    },
    [syncTrackState]
  )

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Xử lý media errors và trả về user-friendly message
   */
  const handleMediaError = useCallback((error: Error): string => {
    const name = error.name || ""
    const message = error.message || ""

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "Quyền truy cập camera/microphone bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt."
    }

    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "Không tìm thấy camera hoặc microphone. Vui lòng kiểm tra thiết bị."
    }

    if (name === "NotReadableError" || name === "TrackStartError") {
      return "Camera hoặc microphone đang được sử dụng bởi ứng dụng khác."
    }

    if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
      return "Thiết bị không hỗ trợ yêu cầu chất lượng. Đang thử cài đặt thấp hơn..."
    }

    if (name === "NotSupportedError") {
      return "Trình duyệt không hỗ trợ truy cập media. Vui lòng sử dụng trình duyệt mới hơn."
    }

    return "Không thể truy cập camera hoặc microphone. Vui lòng kiểm tra quyền truy cập."
  }, [])

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    // Device Management
    enumerateDevices,
    checkDeviceAvailability,
    getDevicePreferences,
    saveDevicePreferences,

    // Stream Management
    getMediaStream,
    cleanupStream,

    // Track Management
    updateTrackEnabled,
    syncTrackState,
    getTrackState,

    // Helpers
    createVideoConstraints,
    createAudioConstraints,
    handleMediaError,

    // Current stream ref (read-only)
    get currentStream() {
      return streamRef.current
    },
  }
}
