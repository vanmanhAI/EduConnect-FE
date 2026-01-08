"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { AuthGuard } from "@/components/auth/auth-guard"

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesPageContent />
    </AuthGuard>
  )
}

function MessagesPageContent() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/chat")
  }, [router])

  return null
}
