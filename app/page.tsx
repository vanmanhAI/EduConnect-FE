"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Users, Trophy, BookOpen, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/layout/app-shell"
import { PostCard } from "@/components/features/posts/post-card"
import { GroupCard } from "@/components/features/groups/group-card"
import { api } from "@/lib/api"
import type { Post, Group } from "@/types"

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([])
  const [featuredGroups, setFeaturedGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedContent = async () => {
      try {
        const [posts, groups] = await Promise.all([api.getPosts(), api.getGroups()])
        setFeaturedPosts(posts.slice(0, 3))
        setFeaturedGroups(groups.slice(0, 3))
      } catch (error) {
        console.error("Failed to load featured content:", error)
      } finally {
        setLoading(false)
      }
    }
    loadFeaturedContent()
  }, [])

  return (
    <AppShell showRightSidebar={false}>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-educonnect-primary/5 via-educonnect-accent/5 to-transparent rounded-2xl p-8 md:p-16">
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-educonnect-primary/10 text-educonnect-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Nền tảng học tập xã hội</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
              Kết nối, học hỏi và{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-educonnect-primary to-educonnect-accent">
                phát triển
              </span>{" "}
              cùng cộng đồng
            </h1>

            <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto leading-relaxed">
              Tham gia EduConnect để chia sẻ kiến thức, thảo luận với chuyên gia và xây dựng mạng lưới học tập chuyên
              nghiệp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-educonnect-primary hover:bg-educonnect-primary/90" asChild>
                <Link href="/feed">
                  Khám phá bảng tin
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/groups">Tham gia nhóm</Link>
              </Button>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-20 h-20 bg-educonnect-primary rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-educonnect-accent rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-educonnect-success rounded-full blur-2xl"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tại sao chọn EduConnect?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nền tảng toàn diện cho việc học tập và phát triển kỹ năng trong thời đại số
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-educonnect-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-educonnect-primary" />
                </div>
                <h3 className="text-xl font-semibold">Cộng đồng chuyên nghiệp</h3>
                <p className="text-muted-foreground">
                  Kết nối với hàng nghìn chuyên gia và người học trong các lĩnh vực khác nhau
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-educonnect-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <BookOpen className="h-6 w-6 text-educonnect-accent" />
                </div>
                <h3 className="text-xl font-semibold">Nội dung chất lượng</h3>
                <p className="text-muted-foreground">
                  Chia sẻ và tiếp cận kiến thức từ những bài viết, thảo luận có giá trị cao
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-educonnect-success/10 rounded-lg flex items-center justify-center mx-auto">
                  <Trophy className="h-6 w-6 text-educonnect-success" />
                </div>
                <h3 className="text-xl font-semibold">Hệ thống thành tích</h3>
                <p className="text-muted-foreground">Theo dõi tiến độ học tập với điểm số, huy hiệu và bảng xếp hạng</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Posts */}
        {!loading && featuredPosts.length > 0 && (
          <section className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Bài viết nổi bật</h2>
              <Button variant="outline" asChild>
                <Link href="/feed">Xem tất cả</Link>
              </Button>
            </div>

            <div className="space-y-6">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          </section>
        )}

        {/* Featured Groups */}
        {!loading && featuredGroups.length > 0 && (
          <section className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Nhóm phổ biến</h2>
              <Button variant="outline" asChild>
                <Link href="/groups">Khám phá nhóm</Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-educonnect-primary to-educonnect-accent rounded-2xl p-8 md:p-16 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Tham gia cộng đồng EduConnect ngay hôm nay và khám phá những cơ hội học tập không giới hạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Đăng ký miễn phí</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-educonnect-primary bg-transparent"
              asChild
            >
              <Link href="/feed">Khám phá ngay</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
