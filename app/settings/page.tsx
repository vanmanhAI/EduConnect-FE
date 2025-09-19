"use client"

import { useRef, useState } from "react"
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

export default function SettingsPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState({
    displayName: "Nguyễn Văn A",
    username: "nguyenvana",
    email: "nguyenvana@example.com",
    bio: "Đam mê học tập và chia sẻ kiến thức với cộng đồng",
    avatar: "/placeholder.svg",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    mentionNotifications: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: false,
    showActivity: true,
  })

  const [loading, setLoading] = useState(false)

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
      await new Promise((r) => setTimeout(r, 800))
      toast({ title: "Đã lưu thay đổi hồ sơ" })
    } catch (e) {
      toast({ title: "Lưu thất bại", description: "Vui lòng thử lại.", variant: "destructive" })
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

  const handleSavePrivacy = async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      toast({ title: "Đã lưu cài đặt riêng tư" })
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
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  />
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

                <Button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-educonnect-primary hover:bg-educonnect-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
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
                        <SelectItem value="friends">Chỉ bạn bè</SelectItem>
                        <SelectItem value="private">Riêng tư</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Hiển thị email</Label>
                      <p className="text-sm text-muted-foreground">Cho phép người khác xem email của bạn</p>
                    </div>
                    <Switch
                      checked={privacy.showEmail}
                      onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, showEmail: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Hiển thị hoạt động</Label>
                      <p className="text-sm text-muted-foreground">Cho phép người khác xem hoạt động của bạn</p>
                    </div>
                    <Switch
                      checked={privacy.showActivity}
                      onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, showActivity: checked }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSavePrivacy}
                  disabled={loading}
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
