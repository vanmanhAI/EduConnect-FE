"use client"

import type { LoginResponse, RegisterResponse, AuthData } from "@/types"

// Types for authentication
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  displayName: string
  username: string
  email: string
  password: string
}

export interface RegisterFormData extends RegisterRequest {
  confirmPassword: string
}

export interface AuthResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: string
      displayName: string
      username: string
      email: string
      avatar?: string
    }
    token: string
    refreshToken: string
  }
}

export interface AuthError {
  success: false
  message: string
  errors?: {
    field: string
    message: string
  }[]
}

export type AuthResult = AuthResponse | AuthError

// Token management
const TOKEN_KEY = "educonnect_token"
const REFRESH_TOKEN_KEY = "educonnect_refresh_token"
const USER_KEY = "educonnect_user"

export const tokenManager = {
  // Save tokens and user data
  saveAuthData: (token: string, refreshToken: string, user: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  },

  // Get access token
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY)
    }
    return null
  },

  // Get user data
  getUser: (): any | null => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(USER_KEY)
      return userStr ? JSON.parse(userStr) : null
    }
    return null
  },

  // Clear all auth data
  clearAuthData: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = tokenManager.getToken()
    if (!token) return false

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Date.now() / 1000
      return payload.exp > currentTime
    } catch {
      return false
    }
  },
}

// API Base URL from environment
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1"

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock API functions (replace with real API calls later)
export const mockAuthAPI = {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResult> {
    await delay(1000) // Simulate API call

    // Mock validation
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        message: "Email và mật khẩu là bắt buộc",
        errors: [
          { field: "email", message: "Email là bắt buộc" },
          { field: "password", message: "Mật khẩu là bắt buộc" },
        ],
      }
    }

    // Mock email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(credentials.email)) {
      return {
        success: false,
        message: "Email không hợp lệ",
        errors: [{ field: "email", message: "Email không hợp lệ" }],
      }
    }

    // Mock authentication (replace with real API call)
    if (credentials.email === "admin@educonnect.com" && credentials.password === "password123") {
      const mockUser = {
        id: "1",
        displayName: "Admin User",
        username: "admin",
        email: credentials.email,
        avatar: "/placeholder-user.jpg",
      }

      const mockToken = "mock.jwt.token.here"
      const mockRefreshToken = "mock.refresh.token.here"

      // Save to localStorage
      tokenManager.saveAuthData(mockToken, mockRefreshToken, mockUser)

      return {
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user: mockUser,
          token: mockToken,
          refreshToken: mockRefreshToken,
        },
      }
    }

    // Mock error for wrong credentials
    return {
      success: false,
      message: "Email hoặc mật khẩu không chính xác",
      errors: [
        { field: "email", message: "Email hoặc mật khẩu không chính xác" },
        { field: "password", message: "Email hoặc mật khẩu không chính xác" },
      ],
    }
  },

  // Register user
  async register(userData: RegisterRequest): Promise<AuthResult> {
    await delay(1200) // Simulate API call

    // Mock validation
    const errors: { field: string; message: string }[] = []

    if (!userData.displayName) {
      errors.push({ field: "displayName", message: "Tên hiển thị là bắt buộc" })
    }

    if (!userData.username) {
      errors.push({ field: "username", message: "Tên người dùng là bắt buộc" })
    } else if (userData.username.length < 3) {
      errors.push({ field: "username", message: "Tên người dùng phải có ít nhất 3 ký tự" })
    }

    if (!userData.email) {
      errors.push({ field: "email", message: "Email là bắt buộc" })
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userData.email)) {
        errors.push({ field: "email", message: "Email không hợp lệ" })
      }
    }

    if (!userData.password) {
      errors.push({ field: "password", message: "Mật khẩu là bắt buộc" })
    } else if (userData.password.length < 8) {
      errors.push({ field: "password", message: "Mật khẩu phải có ít nhất 8 ký tự" })
    }

    // Note: confirmPassword validation should be done on frontend
    // This is just for demonstration

    if (errors.length > 0) {
      return {
        success: false,
        message: "Vui lòng kiểm tra lại thông tin",
        errors,
      }
    }

    // Mock successful registration
    const mockUser = {
      id: Date.now().toString(),
      displayName: userData.displayName,
      username: userData.username,
      email: userData.email,
      avatar: "/placeholder-user.jpg",
    }

    const mockToken = "mock.jwt.token.here"
    const mockRefreshToken = "mock.refresh.token.here"

    // Save to localStorage
    tokenManager.saveAuthData(mockToken, mockRefreshToken, mockUser)

    return {
      success: true,
      message: "Đăng ký thành công",
      data: {
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken,
      },
    }
  },

  // Logout user
  async logout(): Promise<void> {
    await delay(500)
    tokenManager.clearAuthData()
  },

  // Refresh token
  async refreshToken(): Promise<AuthResult> {
    const refreshToken = tokenManager.getRefreshToken()

    if (!refreshToken) {
      return {
        success: false,
        message: "Không có refresh token",
      }
    }

    await delay(800)

    // Mock refresh token logic
    const newToken = "new.mock.jwt.token.here"
    const user = tokenManager.getUser()

    if (user) {
      tokenManager.saveAuthData(newToken, refreshToken, user)
      return {
        success: true,
        message: "Token đã được làm mới",
        data: {
          user,
          token: newToken,
          refreshToken,
        },
      }
    }

    return {
      success: false,
      message: "Không thể làm mới token",
    }
  },
}

// Real API functions - Updated to use actual backend
export const realAuthAPI = {
  async login(credentials: LoginRequest): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data: LoginResponse = await response.json()

      if (response.ok && data.success) {
        // Backend returns success with user data and tokens
        if (data.data && data.data.access_token && data.data.user) {
          // Map backend user data to frontend format
          const frontendUser = {
            id: crypto.randomUUID(), // Generate ID since backend doesn't provide it
            displayName: data.data.user.displayName,
            username: data.data.user.username,
            email: credentials.email, // Use email from request since backend doesn't return it
            avatar: data.data.user.avatar,
            isOnline: data.data.user.isOnline,
          }

          tokenManager.saveAuthData(
            data.data.access_token,
            "", // No refresh token in this response
            frontendUser
          )
        }
        return {
          success: true,
          message: data.message || "Đăng nhập thành công",
          data: {
            user: {
              id: crypto.randomUUID(),
              displayName: data.data?.user.displayName || "",
              username: data.data?.user.username || "",
              email: credentials.email,
              avatar: data.data?.user.avatar || undefined,
            },
            token: data.data?.access_token || "",
            refreshToken: "",
          },
        }
      } else {
        // Handle API errors
        return {
          success: false,
          message: data.message || "Đăng nhập thất bại",
          errors: [],
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: "Lỗi kết nối đến server",
      }
    }
  },

  async register(userData: RegisterRequest): Promise<AuthResult> {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data: RegisterResponse = await response.json()

      if (response.ok && data.success) {
        // Backend returns success with user data and tokens
        if (data.data && data.data.access_token && data.data.user) {
          // Map backend user data to frontend format
          const frontendUser = {
            id: crypto.randomUUID(), // Generate ID since backend doesn't provide it
            displayName: data.data.user.displayName,
            username: data.data.user.username,
            email: userData.email, // Use email from request since backend doesn't return it
            avatar: data.data.user.avatar,
            isOnline: data.data.user.isOnline,
          }

          tokenManager.saveAuthData(
            data.data.access_token,
            "", // No refresh token in this response
            frontendUser
          )
        }
        return {
          success: true,
          message: data.message || "Đăng ký thành công",
          data: {
            user: {
              id: crypto.randomUUID(),
              displayName: data.data?.user.displayName || "",
              username: data.data?.user.username || "",
              email: userData.email,
              avatar: data.data?.user.avatar || undefined,
            },
            token: data.data?.access_token || "",
            refreshToken: "",
          },
        }
      } else {
        // Handle API errors
        return {
          success: false,
          message: data.message || "Đăng ký thất bại",
          errors: [],
        }
      }
    } catch (error) {
      console.error("Register error:", error)
      return {
        success: false,
        message: "Lỗi kết nối đến server",
      }
    }
  },

  async logout(): Promise<void> {
    try {
      const token = tokenManager.getToken()

      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      tokenManager.clearAuthData()
    }
  },
}

// Switch to real API when backend is ready
export const authAPI = realAuthAPI
