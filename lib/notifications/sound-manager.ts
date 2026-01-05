/**
 * Sound & Vibration Manager
 * Quản lý âm thanh và vibration cho notifications
 */

interface SoundConfig {
  enabled: boolean
  volume: number
}

class SoundManager {
  private config: SoundConfig = {
    enabled: true,
    volume: 0.5,
  }

  private audioContext: AudioContext | null = null
  private soundCache: Map<string, AudioBuffer> = new Map()

  /**
   * Khởi tạo AudioContext
   */
  private initAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null

    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn("AudioContext not supported:", error)
        return null
      }
    }

    return this.audioContext
  }

  /**
   * Tạo sound notification đơn giản (beep)
   */
  private createBeepSound(frequency: number = 800, duration: number = 200): void {
    const ctx = this.initAudioContext()
    if (!ctx || !this.config.enabled) return

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch((e) => console.warn("AudioContext resume failed:", e))
    }

    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, ctx.currentTime)
      gainNode.gain.linearRampToValueAtTime(this.config.volume, ctx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration / 1000)
    } catch (error) {
      console.warn("Failed to play sound:", error)
    }
  }

  /**
   * Phát âm thanh cho notification
   */
  playNotificationSound(type: string = "default"): void {
    if (!this.config.enabled) return

    // Tần số khác nhau cho từng loại notification
    const frequencies: Record<string, number> = {
      message: 800,
      mention: 1000,
      achievement: 1200,
      badge: 1100,
      system: 600,
      default: 800,
    }

    const frequency = frequencies[type] || frequencies.default
    this.createBeepSound(frequency, 200)
  }

  /**
   * Vibration (nếu browser hỗ trợ)
   */
  vibrate(pattern: number | number[] = 200): void {
    if (typeof window === "undefined" || !("vibrate" in navigator)) {
      return
    }

    try {
      navigator.vibrate(pattern)
    } catch (error) {
      console.warn("Vibration not supported:", error)
    }
  }

  /**
   * Play sound + vibration cho notification
   */
  playNotification(type: string = "default"): void {
    this.playNotificationSound(type)
    this.vibrate([100, 50, 100]) // Pattern: vibrate 100ms, pause 50ms, vibrate 100ms
  }

  /**
   * Cập nhật config
   */
  updateConfig(config: Partial<SoundConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Bật/tắt sound
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }

  /**
   * Lấy config hiện tại
   */
  getConfig(): SoundConfig {
    return { ...this.config }
  }
}

export const soundManager = new SoundManager()
