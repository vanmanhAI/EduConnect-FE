"use client"

import { useState, useCallback } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface UploadResult {
  url: string
  secure_url?: string // Optional, as backend wraps it
  filename: string
  format: string
  resource_type: string
  [key: string]: any
}

interface UseFileUploadReturn {
  upload: (file: File) => Promise<UploadResult | null>
  isUploading: boolean
  progress: number
  error: string | null
  reset: () => void
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        const result = await api.uploadFile(file, (percent) => {
          setProgress(percent)
        })
        return result as UploadResult
      } catch (err: any) {
        const errorMessage = err.message || "Upload failed"
        setError(errorMessage)
        toast({
          title: "Lỗi tải lên",
          description: errorMessage,
          variant: "destructive",
        })
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [toast]
  )

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  }
}
