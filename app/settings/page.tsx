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
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, refreshUser, updateUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    mentionNotifications: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    isOnline: true,
  })

  const [originalPrivacy, setOriginalPrivacy] = useState(privacy)
  const [privacyLoading, setPrivacyLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Kiểm tra có thay đổi nào không
  const hasChanges = () => {
    return (
      profile.displayName !== originalProfile.displayName ||
      profile.bio !== originalProfile.bio ||
      profile.location !== originalProfile.location ||
      profile.website !== originalProfile.website ||
      profile.linkedin !== originalProfile.linkedin ||
      profile.github !== originalProfile.github
    )
  }

  // Load user data khi component mount
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

  // Load privacy settings khi user đã load
  useEffect(() => {
    const loadPrivacySettings = async () => {
      if (!user) return

      try {
        setPrivacyLoading(true)
        const privacyData = await api.getUserPrivacy()
        console.log("Privacy settings loaded:", privacyData)

        const privacySettings = {
          profileVisibility: privacyData.profileVisibility || "public",
          isOnline: privacyData.isOnline !== undefined ? privacyData.isOnline : true,
        }

        setPrivacy(privacySettings)
        setOriginalPrivacy(privacySettings)
      } catch (error) {
        console.error("Failed to load privacy settings:", error)
        toast({
          title: "Không thể tải cài đặt riêng tư",
          description: "Sử dụng cài đặt mặc định",
          variant: "destructive",
        })
      } finally {
        setPrivacyLoading(false)
      }
    }

    loadPrivacySettings()
  }, [user, toast])

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
    try {
      const objectUrl = URL.createObjectURL(file)
      setProfile((p) => ({ ...p, avatar: objectUrl }))
      toast({ title: "Đã cập nhật ảnh đại diện", description: file.name })
    } catch (err) {
      toast({ title: "Tải lên thất bại", description: "Vui lòng thử lại.", variant: "destructive" })
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

  const handleSavePrivacy = async () => {
    setLoading(true)
    try {
      console.log("Updating privacy settings:", privacy)

      // Gọi API để cập nhật privacy settings
      const updatedPrivacy = await api.updateUserPrivacy(privacy)

      console.log("Privacy settings updated successfully:", updatedPrivacy)

      // Cập nhật originalPrivacy để so sánh thay đổi
      setOriginalPrivacy(updatedPrivacy)

      // Cập nhật state với data mới từ server
      setPrivacy(updatedPrivacy)

      toast({
        title: "Đã lưu cài đặt riêng tư",
        description: "Cài đặt riêng tư đã được cập nhật thành công",
      })
    } catch (error) {
      console.error("Error updating privacy:", error)
      toast({
        title: "Lưu thất bại",
        description: "Không thể cập nhật cài đặt riêng tư. Vui lòng thử lại.",
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

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-balance">Cài đặt</h1>
          <p className="text-muted-foreground">Quản lý thông tin tài khoản và tùy chọn của bạn</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4 sticky top-0 z-10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
            <TabsTrigger value="notifications">Thông báo</TabsTrigger>
            <TabsTrigger value="privacy">Riêng tư</TabsTrigger>
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
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xl">{profile.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
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

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Cài đặt thông báo
                </CardTitle>
                <CardDescription>Quản lý cách bạn nhận thông báo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Thông báo email</Label>
                      <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Thông báo đẩy</Label>
                      <p className="text-sm text-muted-foreground">Nhận thông báo trên trình duyệt</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Tóm tắt hàng tuần</Label>
                      <p className="text-sm text-muted-foreground">Nhận email tóm tắt hoạt động hàng tuần</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, weeklyDigest: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Thông báo nhắc đến</Label>
                      <p className="text-sm text-muted-foreground">Khi ai đó nhắc đến bạn</p>
                    </div>
                    <Switch
                      checked={notifications.mentionNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, mentionNotifications: checked }))
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="bg-educonnect-primary hover:bg-educonnect-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-none shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Cài đặt riêng tư
                </CardTitle>
                <CardDescription>Kiểm soát ai có thể xem thông tin của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-0">
                {privacyLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hiển thị hồ sơ</Label>
                      <Select
                        value={privacy.profileVisibility}
                        onValueChange={(value) => setPrivacy((prev) => ({ ...prev, profileVisibility: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Công khai</SelectItem>
                          <SelectItem value="private">Riêng tư</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Hiển thị hoạt động</Label>
                        <p className="text-sm text-muted-foreground">Cho phép người khác xem hoạt động của bạn</p>
                      </div>
                      <Switch
                        checked={privacy.isOnline}
                        onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, isOnline: checked }))}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSavePrivacy}
                  disabled={loading || privacyLoading}
                  className="bg-educonnect-primary hover:bg-educonnect-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Bảo mật tài khoản
                </CardTitle>
                <CardDescription>Quản lý mật khẩu và bảo mật tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Lock className="mr-2 h-4 w-4" />
                    Thay đổi mật khẩu
                  </Button>

                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="mr-2 h-4 w-4" />
                    Xác thực hai yếu tố
                  </Button>

                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Globe className="mr-2 h-4 w-4" />
                    Phiên đăng nhập
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-destructive">Vùng nguy hiểm</h4>
                  <Button variant="destructive" className="w-full">
                    Xóa tài khoản
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
