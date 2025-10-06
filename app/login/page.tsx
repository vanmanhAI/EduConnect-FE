"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, ArrowRight, GraduationCap, BookOpen, Users, Trophy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authAPI, type LoginRequest } from "@/lib/auth"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState<LoginRequest>({
    account: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [generalError, setGeneralError] = useState("")

  const handleInputChange = (field: keyof LoginRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    if (generalError) {
      setGeneralError("")
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.account) {
      newErrors.account = "Email là bắt buộc"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.account)) {
      newErrors.account = "Email không hợp lệ"
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setGeneralError("")

    try {
      const result = await authAPI.login(formData)

      if (result.success) {
        console.log("Login successful:", result)

        // Refresh user data trong AuthContext
        await refreshUser()

        router.push("/feed")
      } else {
        // Handle errors from the new response format
        setGeneralError(result.message || "Email hoặc mật khẩu không đúng")
      }
    } catch (error) {
      console.error("Login error:", error)
      setGeneralError("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-cyan-900 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 to-cyan-600/90" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=600')] opacity-10" />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">EduConnect</span>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight">Chào mừng trở lại!</h1>
            <p className="text-xl text-white/80 mb-8">Tiếp tục hành trình học tập của bạn cùng cộng đồng EduConnect</p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Tiếp tục học tập</h3>
                <p className="text-white/70 text-sm">Truy cập vào các khóa học và bài viết đã lưu</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Kết nối bạn bè</h3>
                <p className="text-white/70 text-sm">Tham gia thảo luận với cộng đồng</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Theo dõi tiến trình</h3>
                <p className="text-white/70 text-sm">Xem điểm số và huy hiệu của bạn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-background">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-0 shadow-xl bg-white dark:bg-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
              <CardDescription className="text-center">Chào mừng bạn trở lại với EduConnect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="account">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="account"
                      name="account"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.account}
                      onChange={(e) => handleInputChange("account", e.target.value)}
                      className={`pl-10 h-11 ${errors.account ? "border-red-500 focus:border-red-500" : ""}`}
                      autoComplete="email"
                      required
                    />
                  </div>
                  {errors.account && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.account}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className={`pr-10 h-11 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                      style={
                        {
                          WebkitTextSecurity: showPassword ? "none" : "disc",
                          WebkitAppearance: "none",
                        } as React.CSSProperties
                      }
                      autoComplete="current-password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end text-sm pt-1">
                  <Link href="/forgot-password" className="text-indigo-600 hover:underline font-medium">
                    Quên mật khẩu?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-medium shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    "Đang đăng nhập..."
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* ⚠️ Cảnh báo đặt ngay dưới nút */}
                {generalError && (
                  <div className="mt-3 flex justify-center">
                    <p className="text-sm text-red-500 text-center flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {generalError}
                    </p>
                  </div>
                )}
              </form>

              <Separator />

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Chưa có tài khoản? </span>
                <Link href="/register" className="text-indigo-600 hover:underline font-medium">
                  Đăng ký ngay
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
