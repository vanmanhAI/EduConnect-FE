"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, User, ArrowRight, GraduationCap, BookOpen, Users, Trophy, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authAPI, type RegisterRequest, type AuthResult } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegisterRequest>({
    displayName: "",
    username: "",
    email: "",
    password: "",
  })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [generalError, setGeneralError] = useState("")

  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    if (generalError) {
      setGeneralError("")
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    // Clear confirm password error when user starts typing
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }))
    }
    if (generalError) {
      setGeneralError("")
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.displayName) {
      newErrors.displayName = "Tên hiển thị là bắt buộc"
    }

    if (!formData.username) {
      newErrors.username = "Tên người dùng là bắt buộc"
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên người dùng phải có ít nhất 3 ký tự"
    }

    if (!formData.email) {
      newErrors.email = "Email là bắt buộc"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc"
    } else if (formData.password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc"
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setGeneralError("")

    try {
      const result = await authAPI.register(formData)

      if (result.success) {
        console.log("Registration successful:", result)
        // Redirect to feed on success
        router.push("/feed")
      } else {
        // Handle errors from the new response format
        setGeneralError(result.message || "Đã xảy ra lỗi khi đăng ký")
      }
    } catch (error) {
      console.error("Register error:", error)
      setGeneralError("Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      setLoading(false)
    }
  }

  const isFormValid =
    formData.displayName &&
    formData.username &&
    formData.email &&
    formData.password &&
    confirmPassword &&
    formData.password === confirmPassword

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

            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Kết nối cộng đồng
              <br />
              học tập toàn cầu
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Tham gia hàng nghìn học viên trên khắp thế giới để chia sẻ kiến thức và phát triển kỹ năng
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Học tập tương tác</h3>
                <p className="text-white/70 text-sm">Tham gia thảo luận và chia sẻ kiến thức</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Cộng đồng sôi động</h3>
                <p className="text-white/70 text-sm">Kết nối với những người cùng chí hướng</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Thành tựu và huy hiệu</h3>
                <p className="text-white/70 text-sm">Theo dõi tiến trình và nhận thưởng</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                EduConnect
              </h1>
              <p className="text-muted-foreground mt-2">Tạo tài khoản để bắt đầu hành trình học tập</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl bg-white dark:bg-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center">Tạo tài khoản</CardTitle>
              <CardDescription className="text-center">Tham gia cộng đồng học tập EduConnect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {generalError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Tên hiển thị</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        name="displayName"
                        placeholder=""
                        value={formData.displayName}
                        onChange={(e) => handleInputChange("displayName", e.target.value)}
                        className={`pl-10 h-11 ${errors.displayName ? "border-red-500 focus:border-red-500" : ""}`}
                        autoComplete="name"
                        required
                      />
                    </div>
                    {errors.displayName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.displayName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Tên người dùng</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder=""
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className={`h-11 ${errors.username ? "border-red-500 focus:border-red-500" : ""}`}
                      autoComplete="username"
                      required
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`pl-10 h-11 ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                        autoComplete="email"
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
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
                        placeholder="Tối thiểu 8 ký tự"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`pr-10 h-11 [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:appearance-none ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                        style={
                          {
                            WebkitTextSecurity: showPassword ? "none" : "disc",
                            WebkitAppearance: "none",
                          } as React.CSSProperties
                        }
                        autoComplete="new-password"
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        className={`pr-10 h-11 [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:appearance-none ${errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""}`}
                        style={
                          {
                            WebkitTextSecurity: showConfirmPassword ? "none" : "disc",
                            WebkitAppearance: "none",
                          } as React.CSSProperties
                        }
                        autoComplete="new-password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-medium shadow-lg"
                  disabled={loading || !isFormValid}
                >
                  {loading ? (
                    "Đang tạo tài khoản..."
                  ) : (
                    <>
                      Tạo tài khoản
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <Separator />

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Đã có tài khoản? </span>
                <Link href="/login" className="text-indigo-600 hover:underline font-medium">
                  Đăng nhập ngay
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
