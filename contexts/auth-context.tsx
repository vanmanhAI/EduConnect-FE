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
  login: (token: string, refreshToken: string) => Promise<void>
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

  const login = async (token: string, refreshToken: string) => {
    try {
      // Lưu token trước
      tokenManager.saveAuthData(token, refreshToken, null)

      // Lấy user data từ API
      const userData = await api.getCurrentUser()
      console.log("User data after login:", userData)

      // Lưu user data vào state và localStorage
      setUser(userData)
      tokenManager.saveAuthData(token, refreshToken, userData)
    } catch (error) {
      console.error("Failed to get user data after login:", error)
      tokenManager.clearAuthData()
      setUser(null)
      throw error
    }
  }

  const updateUser = (userData: User) => {
    console.log("updateUser called with:", userData)
    setUser(userData)
    // Cập nhật localStorage với data mới
    const token = tokenManager.getToken()
    if (token) {
      console.log("Saving updated user data to localStorage:", userData)
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
          console.log("Loading user from localStorage:", storedUser)
          setUser(storedUser)

          // Sau đó refresh data từ API để sync với server
          try {
            console.log("Refreshing user data from server...")
            const serverUserData = await api.getCurrentUser()
            console.log("Server user data:", serverUserData)

            // So sánh avatar - nếu localStorage có avatar mới hơn, giữ lại
            const finalUserData = {
              ...serverUserData,
              // Giữ avatar từ localStorage nếu có và khác với server
              avatar:
                storedUser.avatar !== serverUserData.avatar && storedUser.avatar
                  ? storedUser.avatar
                  : serverUserData.avatar,
            }

            console.log("Final merged user data:", finalUserData)
            setUser(finalUserData)

            // Cập nhật localStorage với merged data
            tokenManager.saveAuthData(token, tokenManager.getRefreshToken() || "", finalUserData)
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
    login,
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
