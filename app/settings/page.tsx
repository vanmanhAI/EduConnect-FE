"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, Save, Bell, Shield, Globe, User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AppShell } from "@/components/layout/app-shell"
import { useToast } from "@/hooks/use-toast"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth/auth-guard"
import { api } from "@/lib/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsPageContent />
    </AuthGuard>
  )
}

function SettingsPageContent() {
  const { toast } = useToast()
  const { user, refreshUser, updateUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Use custom upload hook
  const { upload, isUploading, progress } = useFileUpload()

  const [profile, setProfile] = useState({
    displayName: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
    avatar: "/placeholder.svg",
  })

  const [originalProfile, setOriginalProfile] = useState(profile)
  const [loading, setLoading] = useState(false)

  // Load user data
  useEffect(() => {
    if (user) {
      const userData = {
        displayName: user.displayName || "",
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        avatar: user.avatar || "/placeholder.svg",
      }
      setProfile(userData)
      setOriginalProfile(userData)
    }
  }, [user])

  const hasChanges = () => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile)
  }

  // ... existing code ...

  const handlePickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ["image/jpeg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast({ title: "Định dạng không hỗ trợ", description: "Chỉ JPG, PNG, WEBP", variant: "destructive" })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Tệp quá lớn", description: "Giới hạn 5MB", variant: "destructive" })
      return
    }

    // Upload file immediately
    try {
      // Create local preview first
      const objectUrl = URL.createObjectURL(file)
      setProfile((p) => ({ ...p, avatar: objectUrl }))

      const result = await upload(file)

      if (result) {
        // Update profile state with real URL
        setProfile((p) => ({ ...p, avatar: result.url }))

        // Also auto-save the avatar change to backend immediately
        const updatedUserRaw = await api.updateCurrentUser({ avatar: result.url })

        // Refresh user context with the data from backend
        // We forcibly use the secure_url we just got to prevent any stale data from backend
        if (updatedUserRaw) {
          updateUser({ ...updatedUserRaw, avatar: result.url })
        }

        toast({ title: "Đã cập nhật ảnh đại diện", description: "Ảnh đại diện mới đã được lưu" })
      }
    } catch (err) {
      // Error is handled by hook's toast, but we might want to revert preview
      console.error("Avatar upload error", err)
      // Revert logic could go here if needed
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      // Tạo object chỉ chứa các field có thể cập nhật
      const updateData = {
        displayName: profile.displayName,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        linkedin: profile.linkedin,
        github: profile.github,
      }

      console.log("Updating profile with data:", updateData)

      // Gọi API để cập nhật profile
      const updatedUser = await api.updateCurrentUser(updateData)

      // Cập nhật user context với data mới
      updateUser(updatedUser)

      // Cập nhật originalProfile để so sánh thay đổi
      setOriginalProfile(profile)

      toast({
        title: "Đã lưu thay đổi hồ sơ",
        description: "Thông tin của bạn đã được cập nhật thành công",
      })
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Lưu thất bại",
        description: "Không thể cập nhật thông tin. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      toast({ title: "Đã lưu cài đặt thông báo" })
    } catch (e) {
      toast({ title: "Lưu thất bại", description: "Vui lòng thử lại.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const [isChangingPassword, setIsChangingPassword] = useState(false)

  async function onPasswordSubmit(values: PasswordFormValues) {
    setIsChangingPassword(true)
    try {
      await api.changePassword(values.oldPassword, values.newPassword)
      toast({
        title: "Thành công",
        description: "Mật khẩu của bạn đã được thay đổi.",
      })
      passwordForm.reset()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể đổi mật khẩu. Vui lòng thử lại.",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-balance">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản và tùy chọn của bạn</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 sticky top-0 z-10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
            <TabsTrigger value="account">Tài khoản</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
                <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={profile.avatar || "/placeholder.svg"}
                        className={isUploading ? "opacity-50" : ""}
                      />
                      <AvatarFallback className="text-xl">{profile.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
                        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <span className="sr-only">Đang tải... {progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickAvatar}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Thay đổi ảnh đại diện
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP tối đa 5MB</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Tên hiển thị</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Tên người dùng</Label>
                    <Input id="username" value={profile.username} disabled className="opacity-60" />
                    <p className="text-xs text-muted-foreground">Tên người dùng không thể thay đổi</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Giới thiệu</Label>
                  <Textarea
                    id="bio"
                    placeholder="Viết vài dòng về bản thân..."
                    value={profile.bio}
                    onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Địa điểm</Label>
                    <Input
                      id="location"
                      placeholder="Hà Nội, Việt Nam"
                      value={profile.location}
                      onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={profile.website}
                      onChange={(e) => setProfile((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      placeholder="https://linkedin.com/in/username"
                      value={profile.linkedin}
                      onChange={(e) => setProfile((prev) => ({ ...prev, linkedin: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      placeholder="https://github.com/username"
                      value={profile.github}
                      onChange={(e) => setProfile((prev) => ({ ...prev, github: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={loading || !hasChanges()}
                  className="bg-educonnect-primary hover:bg-educonnect-primary/90 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>

                {hasChanges() && <p className="text-sm text-muted-foreground">Bạn có thay đổi chưa lưu</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Bảo mật tài khoản
                </CardTitle>
                <CardDescription>Quản lý mật khẩu của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                    <FormField
                      control={passwordForm.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu hiện tại</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isChangingPassword} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mật khẩu mới</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isChangingPassword} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={isChangingPassword} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isChangingPassword} className="bg-educonnect-primary">
                      {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đổi mật khẩu
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
