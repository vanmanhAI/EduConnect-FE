"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "@/types"
import { tokenManager } from "@/lib/auth"
import { api } from "@/lib/api"

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  refreshUser: () => Promise<void>
  updateUser: (userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        setUser(null)
        return
      }

      const userData = await api.getCurrentUser()
      setUser(userData)

      // Cập nhật localStorage với data mới
      tokenManager.saveAuthData(token, tokenManager.getRefreshToken() || "", userData)
    } catch (error) {
      console.error("Failed to refresh user data:", error)
      // Nếu API fail, xóa token và user data
      tokenManager.clearAuthData()
      setUser(null)
    }
  }

  const logout = () => {
    tokenManager.clearAuthData()
    setUser(null)
  }

  const updateUser = (userData: User) => {
    setUser(userData)
    // Cập nhật localStorage với data mới
    const token = tokenManager.getToken()
    if (token) {
      tokenManager.saveAuthData(token, tokenManager.getRefreshToken() || "", userData)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)

        // Kiểm tra localStorage trước
        const storedUser = tokenManager.getUser()
        const token = tokenManager.getToken()

        if (storedUser && token) {
          // Hiển thị user từ localStorage trước
          setUser(storedUser)

          // Sau đó refresh data từ API
          try {
            await refreshUser()
          } catch (error) {
            console.error("Failed to refresh user on init:", error)
            // Giữ user data từ localStorage nếu API fail
          }
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value = {
    user,
    setUser,
    loading,
    refreshUser,
    updateUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
