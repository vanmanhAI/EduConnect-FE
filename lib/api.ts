"use client"

import type {
  User,
  Group,
  Post,
  Comment,
  ChatMessage,
  ChatThread,
  Conversation,
  Badge,
  LeaderboardEntry,
  Notification,
  SearchResult,
  GroupsApiResponse,
  CreateGroupRequest,
  CreateGroupApiResponse,
  FollowersResponse,
  FollowingResponse,
  FollowerApiData,
  UserProfileResponse,
  FollowResponse,
  UnfollowResponse,
} from "@/types"
import { tokenManager } from "@/lib/auth"

// Simulate API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    username: "nguyenvan",
    email: "nguyen@example.com",
    displayName: "Nguyễn Văn A",
    avatar: "/placeholder.svg?height=40&width=40",
    bio: "Sinh viên CNTT, yêu thích lập trình và học máy",
    points: 1250,
    level: 5,
    badges: [],
    followers: 45,
    following: 32,
    joinedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    username: "tranthib",
    email: "tran@example.com",
    displayName: "Trần Thị B",
    avatar: "/placeholder.svg?height=40&width=40",
    bio: "Chuyên gia UI/UX, chia sẻ kiến thức thiết kế",
    points: 890,
    level: 4,
    badges: [],
    followers: 67,
    following: 28,
    joinedAt: new Date("2024-02-01"),
  },
]

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Lập trình JavaScript",
    description: "Cộng đồng học và chia sẻ kiến thức JavaScript",
    coverImage: "/placeholder.svg?height=200&width=800",
    memberCount: 234,
    postCount: 15,
    tag: ["javascript", "frontend", "backend"],
    isPrivate: false,
    tags: ["javascript", "frontend", "backend"],
    createdAt: new Date("2024-01-01"),
    ownerId: "1",
    members: [],
    userRole: "member",
    joinStatus: "joined",
  },
  {
    id: "2",
    name: "Thiết kế UI/UX",
    description: "Thảo luận về thiết kế giao diện và trải nghiệm người dùng",
    coverImage: "/placeholder.svg?height=200&width=800",
    memberCount: 156,
    postCount: 8,
    tag: ["design", "ui", "ux"],
    isPrivate: false,
    tags: ["design", "ui", "ux"],
    createdAt: new Date("2024-01-10"),
    ownerId: "2",
    members: [],
    userRole: null,
    joinStatus: "not-joined",
  },
]

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Cách tối ưu hiệu suất React với useMemo",
    content:
      "# Tối ưu hiệu suất React\n\nViệc sử dụng `useMemo` giúp tránh tính toán lại không cần thiết:\n\n```javascript\nconst expensiveValue = useMemo(() => {\n  return computeExpensiveValue(a, b);\n}, [a, b]);\n```\n\nĐiều này đặc biệt hữu ích khi...",
    authorId: "1",
    author: mockUsers[0],
    groupId: "1",
    group: mockGroups[0],
    tags: ["react", "performance", "javascript"],
    attachments: [],
    reactions: [],
    commentCount: 12,
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
    isLiked: false,
    likeCount: 24,
  },
]

const mockBadges: Badge[] = [
  {
    id: "1",
    name: "Người mới",
    description: "Chào mừng bạn đến với EduConnect!",
    icon: "🌟",
    color: "#10B981",
    criteria: "Tham gia cộng đồng",
    rarity: "common",
  },
  {
    id: "2",
    name: "Chuyên gia JavaScript",
    description: "Đã đóng góp nhiều bài viết về JavaScript",
    icon: "⚡",
    color: "#F59E0B",
    criteria: "Đăng 10 bài viết về JavaScript",
    rarity: "rare",
  },
]

const mockChatThreads: ChatThread[] = [
  {
    id: "1",
    participants: [
      {
        id: "2",
        name: "Trần Thị B",
        displayName: "Trần Thị B",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
      },
    ],
    lastMessage: {
      id: "msg-1",
      content: "Bạn có thể giúp mình review code này được không?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      senderId: "2",
    },
    unreadCount: 2,
    type: "direct",
  },
  {
    id: "2",
    participants: [
      {
        id: "3",
        name: "Lê Văn C",
        displayName: "Lê Văn C",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: false,
      },
    ],
    lastMessage: {
      id: "msg-2",
      content: "Cảm ơn bạn đã chia sẻ tài liệu!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      senderId: "3",
    },
    unreadCount: 0,
    type: "direct",
  },
  {
    id: "3",
    participants: [
      {
        id: "4",
        name: "Phạm Thị D",
        displayName: "Phạm Thị D",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
      },
    ],
    lastMessage: {
      id: "msg-3",
      content: "Hẹn gặp lại trong buổi học tiếp theo nhé!",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      senderId: "4",
    },
    unreadCount: 0,
    type: "direct",
  },
  {
    id: "group-1",
    participants: [
      {
        id: "group-js",
        name: "Nhóm JavaScript",
        displayName: "Nhóm JavaScript",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
      },
    ],
    lastMessage: {
      id: "msg-group-1",
      content: "Ai có thể giải thích về closure trong JS không?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      senderId: "5",
    },
    unreadCount: 5,
    type: "group",
  },
]

const mockChatMessages: { [threadId: string]: ChatMessage[] } = {
  "1": [
    {
      id: "1",
      threadId: "1",
      senderId: "2",
      sender: mockUsers[1],
      conversationId: "1",
      content: "Chào bạn! Mình có một đoạn code React cần review",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      type: "text",
      isRead: false,
    },
    {
      id: "2",
      threadId: "1",
      senderId: "current-user",
      sender: mockUsers[0],
      conversationId: "1",
      content: "Chào bạn! Mình sẵn sàng giúp đỡ. Bạn gửi code lên nhé",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      type: "text",
      isRead: false,
    },
    {
      id: "3",
      threadId: "1",
      senderId: "2",
      sender: mockUsers[1],
      conversationId: "1",
      content: "Bạn có thể giúp mình review code này được không?",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      type: "text",
      isRead: false,
    },
  ],
  "2": [
    {
      id: "4",
      threadId: "2",
      senderId: "3",
      sender: mockUsers[0],
      conversationId: "2",
      content: "Tài liệu về React Hooks bạn chia sẻ rất hữu ích!",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      type: "text",
      isRead: false,
    },
    {
      id: "5",
      threadId: "2",
      senderId: "current-user",
      sender: mockUsers[0],
      conversationId: "2",
      content: "Mình rất vui khi tài liệu đó giúp ích được cho bạn 😊",
      timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      type: "text",
      isRead: false,
    },
    {
      id: "6",
      threadId: "2",
      senderId: "3",
      sender: mockUsers[0],
      conversationId: "2",
      content: "Cảm ơn bạn đã chia sẻ tài liệu!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: "text",
      isRead: false,
    },
  ],
}

// Helper function to transform tags from BE format to string[]
const transformTags = (tags: any[]): string[] => {
  if (!tags || !Array.isArray(tags)) return []
  return tags
    .map((tag: any) => {
      if (typeof tag === "string") return tag
      if (tag && typeof tag === "object" && tag.name) return tag.name
      return ""
    })
    .filter((tag: string) => tag)
}

// API functions
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1"
export const api = {
  // Users
  async getCurrentUser(): Promise<User> {
    // Gọi API thật lấy thông tin user hiện tại
    const token = typeof window !== "undefined" ? localStorage.getItem("educonnect_token") : null
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/users/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("getCurrentUser API response:", data)

    // Transform backend data to match frontend User interface
    const backendUser = data.data || data
    return {
      id: backendUser.id || crypto.randomUUID(),
      username: backendUser.username || "",
      email: backendUser.email || "",
      displayName: backendUser.displayName || backendUser.name || "",
      avatar: backendUser.avatar || null,
      bio: backendUser.bio || "",
      location: backendUser.location || "",
      website: backendUser.website || "",
      linkedin: backendUser.linkedin || "",
      github: backendUser.github || "",
      points: backendUser.points || 0,
      level: backendUser.level || 1,
      experiencePoints: backendUser.experiencePoints || 0,
      followersCount: backendUser.followersCount || 0,
      followingCount: backendUser.followingCount || 0,
      postsCount: backendUser.postsCount || 0,
      groupsCount: backendUser.groupsCount || 0,
      experienceLevel: backendUser.experienceLevel || "beginner",
      profileVisibility: backendUser.profileVisibility || "public",
      badges: backendUser.badges || [],
      followers: backendUser.followersCount || 0,
      following: backendUser.followingCount || 0,
      joinedAt: backendUser.joinedAt ? new Date(backendUser.joinedAt) : new Date(),
      isFollowing: backendUser.isFollowing || false,
      isOnline: backendUser.isOnline || false,
    }
  },

  async updateCurrentUser(profileData: {
    displayName?: string
    bio?: string
    location?: string
    website?: string
    linkedin?: string
    github?: string
    avatar?: string
  }): Promise<User> {
    // Gọi API PATCH để cập nhật thông tin user
    const token = typeof window !== "undefined" ? localStorage.getItem("educonnect_token") : null
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/users/me",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileData),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("updateCurrentUser API response:", data)

    // Transform backend data to match frontend User interface
    const backendUser = data.data || data
    return {
      id: backendUser.id || crypto.randomUUID(),
      username: backendUser.username || "",
      email: backendUser.email || "",
      displayName: backendUser.displayName || backendUser.name || "",
      avatar: backendUser.avatar || null,
      bio: backendUser.bio || "",
      location: backendUser.location || "",
      website: backendUser.website || "",
      linkedin: backendUser.linkedin || "",
      github: backendUser.github || "",
      points: backendUser.points || 0,
      level: backendUser.level || 1,
      experiencePoints: backendUser.experiencePoints || 0,
      followersCount: backendUser.followersCount || 0,
      followingCount: backendUser.followingCount || 0,
      postsCount: backendUser.postsCount || 0,
      groupsCount: backendUser.groupsCount || 0,
      experienceLevel: backendUser.experienceLevel || "beginner",
      profileVisibility: backendUser.profileVisibility || "public",
      badges: backendUser.badges || [],
      followers: backendUser.followersCount || 0,
      following: backendUser.followingCount || 0,
      joinedAt: backendUser.joinedAt ? new Date(backendUser.joinedAt) : new Date(),
      isFollowing: backendUser.isFollowing || false,
      isOnline: backendUser.isOnline || false,
    }
  },

  async forgotPassword(email: string) {
    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || data.error || "Gửi yêu cầu thất bại")
    }
    return data
  },

  async resetPassword(password: string, token: string) {
    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/auth/reset-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, token }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || data.error || "Đặt lại mật khẩu thất bại")
    }
    return data.data || data
  },

  async verifyResetToken(token: string) {
    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") +
        "/auth/verify-reset-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      return { isValid: false }
    }
    return data.data || data
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("educonnect_token") : null
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/auth/change-password",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || data.error || "Đổi mật khẩu thất bại")
    }
    return data.data || data
  },

  async getUserPrivacy(): Promise<{
    profileVisibility: string
    isOnline: boolean
  }> {
    // Gọi API GET để lấy privacy settings
    const token = typeof window !== "undefined" ? localStorage.getItem("educonnect_token") : null
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/users/me/privacy",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("getUserPrivacy API response:", data)

    return data.data || data
  },

  async updateUserPrivacy(privacyData: { profileVisibility: string; isOnline: boolean }): Promise<{
    profileVisibility: string
    isOnline: boolean
  }> {
    // Gọi API PATCH để cập nhật privacy settings
    const token = typeof window !== "undefined" ? localStorage.getItem("educonnect_token") : null
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    console.log("Updating privacy with data:", privacyData)

    const response = await fetch(
      (process.env.NEXT_PUBLIC_API_BASE || "https://educonnect-be-wx8t.onrender.com/api/v1") + "/users/me/privacy",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(privacyData),
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("updateUserPrivacy API response:", data)

    return data.data || privacyData
  },

  async getUser(id: string): Promise<User | null> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data: UserProfileResponse = await res.json()
    if (!res.ok) {
      throw new Error((data && data.message) || "Không thể tải thông tin người dùng")
    }

    if (!data.data) {
      return null
    }

    // Transform API response to match User type
    const userData = data.data
    const transformedUser: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      avatar: userData.avatar,
      bio: userData.bio || undefined,
      location: userData.location || undefined,
      website: userData.website || undefined,
      linkedin: userData.linkedin || undefined,
      github: userData.github || undefined,
      points: userData.points || 0,
      level: userData.level || 1,
      experiencePoints: userData.experiencePoints || 0,
      followersCount: userData.followersCount || 0,
      followingCount: userData.followingCount || 0,
      postsCount: userData.postsCount || 0,
      groupsCount: userData.groupsCount || 0,
      experienceLevel: userData.experienceLevel,
      profileVisibility: userData.profileVisibility,
      badges: [], // API doesn't provide badges
      followers: userData.followersCount || 0,
      following: userData.followingCount || 0,
      joinedAt: new Date(userData.createdAt),
      isOnline: userData.isOnline || false,
      isFollowing: userData.isFollowing || false,
    }

    return transformedUser
  },

  async getUsers(): Promise<User[]> {
    const token = tokenManager.getToken()

    try {
      // Try real API first
      const response = await fetch(`${API_BASE}/users?onlineOnly=true`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        const users = data.data || data || []

        // Transform backend response to frontend User type
        return users.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: "", // Backend doesn't return email for privacy
          displayName: user.displayName,
          avatar: user.avatar || null,
          bio: user.bio || "",
          location: "",
          website: "",
          linkedin: "",
          github: "",
          points: user.points || 0,
          level: user.level || 1,
          experiencePoints: 0,
          followersCount: user.followersCount || 0,
          followingCount: user.followingCount || 0,
          postsCount: 0,
          groupsCount: 0,
          experienceLevel: "beginner" as const,
          profileVisibility: user.profileVisibility || "public",
          badges: [],
          followers: user.followersCount || 0,
          following: user.followingCount || 0,
          joinedAt: new Date(),
          isFollowing: user.isFollowing || false,
          isOnline: user.isOnline || false,
        }))
      }
    } catch (error) {
      console.warn("Real API getUsers failed, falling back to mock:", error)
    }

    // Fallback to mock data
    await delay(400)
    return mockUsers
  },

  async searchUsers(
    keyword: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: User[]; hasMore: boolean; total: number }> {
    const token = tokenManager.getToken()
    const url = new URL(`${API_BASE}/users/search`)
    url.searchParams.set("keyword", keyword)
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || "Tìm kiếm thất bại")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid search data structure:", data)
      return {
        users: [],
        hasMore: false,
        total: 0,
      }
    }

    // Transform backend data to frontend User type
    const users = data.data.items.map((user: any) => ({
      id: user.id,
      username: user.username,
      email: "", // Backend doesn't return email for privacy
      displayName: user.displayName,
      avatar: user.avatar || null,
      bio: user.bio || "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      points: user.points || 0,
      level: user.level || 1,
      experiencePoints: 0,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: 0,
      groupsCount: 0,
      experienceLevel: "beginner" as const,
      profileVisibility: user.profileVisibility || "public",
      badges: [],
      followers: user.followersCount || 0,
      following: user.followingCount || 0,
      joinedAt: new Date(),
      isFollowing: user.isFollowing || false,
      isOnline: user.isOnline || false,
    }))

    return {
      users,
      hasMore: data.data.hasMore || false,
      total: data.data.items.length,
    }
  },

  async searchPosts(
    keyword: string,
    page: number = 1,
    limit: number = 10,
    decayFactor: number = 1
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    const token = tokenManager.getToken()
    const url = new URL(`${API_BASE}/posts/search`)
    url.searchParams.set("keyword", keyword)
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", String(limit))
    url.searchParams.set("decayFactor", String(decayFactor))

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || "Tìm kiếm bài viết thất bại")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid search posts data structure:", data)
      return {
        posts: [],
        hasMore: false,
      }
    }

    // Transform API data to match Post interface
    const posts: Post[] = data.data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      slug: item.slug || undefined,
      excerpt: item.excerpt || undefined,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName,
        avatar: item.author.avatar,
        email: "",
        points: 0,
        level: 1,
        badges: [],
        followers: 0,
        following: 0,
        joinedAt: new Date(),
      },
      groupId: item.group?.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      tags: item.tags?.map((tag: any) => tag.name || tag) || [],
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }))

    return {
      posts,
      hasMore: data.data.hasMore || false,
    }
  },

  async getFollowers(userId: string): Promise<User[]> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/users/${userId}/followers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data: FollowersResponse = await res.json()
    if (!res.ok) {
      throw new Error((data && data.message) || "Không thể tải danh sách người theo dõi")
    }

    // Transform API response to match User type
    const transformedFollowers: User[] = (data.data || []).map((follower: any) => ({
      id: follower.id,
      username: follower.username,
      email: "", // API doesn't provide email
      displayName: follower.displayName,
      avatar: follower.avatar,
      bio: follower.bio || undefined,
      location: undefined,
      website: undefined,
      linkedin: undefined,
      github: undefined,
      points: follower.points || 0,
      level: follower.level || 1,
      experiencePoints: undefined,
      followersCount: follower.followersCount || 0,
      followingCount: follower.followingCount || 0,
      postsCount: undefined,
      groupsCount: undefined,
      experienceLevel: undefined,
      profileVisibility: follower.profileVisibility,
      badges: [],
      followers: follower.followersCount || 0,
      following: follower.followingCount || 0,
      joinedAt: new Date(), // API doesn't provide joinedAt
      isOnline: follower.isOnline || false,
      isFollowing: follower.isFollowing || false,
    }))

    return transformedFollowers
  },

  async getFollowing(userId: string): Promise<User[]> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/users/${userId}/following`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data: FollowingResponse = await res.json()
    if (!res.ok) {
      throw new Error((data && data.message) || "Không thể tải danh sách người đang theo dõi")
    }

    // Transform API response to match User type
    const transformedFollowing: User[] = (data.data || []).map((following: any) => ({
      id: following.id,
      username: following.username,
      email: "", // API doesn't provide email
      displayName: following.displayName,
      avatar: following.avatar,
      bio: following.bio || undefined,
      location: undefined,
      website: undefined,
      linkedin: undefined,
      github: undefined,
      points: following.points || 0,
      level: following.level || 1,
      experiencePoints: undefined,
      followersCount: following.followersCount || 0,
      followingCount: following.followingCount || 0,
      postsCount: undefined,
      groupsCount: undefined,
      experienceLevel: undefined,
      profileVisibility: following.profileVisibility,
      badges: [],
      followers: following.followersCount || 0,
      following: following.followingCount || 0,
      joinedAt: new Date(), // API doesn't provide joinedAt
      isOnline: following.isOnline || false,
      isFollowing: following.isFollowing || false,
    }))

    return transformedFollowing
  },

  async followUser(userId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/users/${userId}/follow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data: FollowResponse = await res.json()
    if (!res.ok || !data.success) {
      throw new Error((data && data.message) || "Không thể theo dõi người dùng")
    }
  },

  async unfollowUser(userId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/users/${userId}/unfollow`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data: UnfollowResponse = await res.json()
    if (!res.ok || !data.success) {
      throw new Error((data && data.message) || "Không thể bỏ theo dõi người dùng")
    }
  },

  async getPostsByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    const token = tokenManager.getToken()
    const url = new URL(`${API_BASE}/posts/by-user/${userId}`)
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    console.log("getPostsByUser API response:", data)

    if (!res.ok) {
      throw new Error((data && data.message) || "Không thể tải danh sách bài viết")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid posts data structure:", data)
      return {
        posts: [],
        hasMore: false,
      }
    }

    // Transform backend data to frontend Post type
    const posts: Post[] = data.data.items.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      slug: post.slug,
      excerpt: post.excerpt,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
      authorId: post.author?.id,
      author: {
        id: post.author?.id,
        username: post.author?.username,
        displayName: post.author?.displayName,
        avatar: post.author?.avatar,
      },
      isLiked: post.isLiked || false,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      tags: transformTags(post.tags) || [],
      reactions: post.reactions || [],
      isCommented: post.isCommented || false,
    }))

    return {
      posts,
      hasMore: data.data.hasMore || false,
    }
  },

  // Groups
  async getGroups(page: number = 1, limit: number = 10): Promise<{ groups: Group[]; hasMore: boolean; total: number }> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/groups?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data: any = await res.json()
    if (!res.ok) {
      throw new Error((data && data.message) || "Không thể tải danh sách nhóm")
    }

    // Check if data structure is valid (new format: data.items)
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid groups data structure:", data)
      return { groups: [], hasMore: false, total: 0 }
    }

    // Transform API data to match frontend interface
    const groups = data.data.items.map((group: any) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description || "",
      coverImage: group.coverImage,
      avatar: group.avatar,
      ownerId: group.ownerId,
      memberCount: group.memberCount || 0,
      postCount: group.postCount || 0,
      createdAt: new Date(group.createdAt),
      tags: (group.tags || []).filter((tag: any) => tag && tag.name).map((tag: any) => tag.name),
      isPrivate: false,
      members: [],
      userRole: group.isJoined ? "member" : null,
      joinStatus: group.isJoined ? "joined" : "not-joined",
    }))

    return {
      groups,
      hasMore: data.data.hasMore || false,
      total: data.data.items.length,
    }
  },

  async createGroup(payload: {
    name: string
    description?: string
    tags?: string[]
    privacy?: "public" | "private"
    coverImage?: string
  }): Promise<Group> {
    const token = tokenManager.getToken()

    // Transform payload to match backend API
    const requestBody: CreateGroupRequest = {
      name: payload.name,
      description: payload.description || "",
      tags: payload.tags || [],
      privacy: payload.privacy,
      coverImage: payload.coverImage,
    }

    const res = await fetch(`${API_BASE}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    })

    const data: CreateGroupApiResponse = await res.json()
    if (!res.ok) {
      throw new Error((data && data.message) || "Tạo nhóm thất bại")
    }

    // Transform API response to frontend Group interface
    const apiGroup = data.data
    const group: Group = {
      id: apiGroup.id,
      name: apiGroup.name,
      description: apiGroup.description,
      coverImage: apiGroup.coverImage,
      avatar: apiGroup.avatar,
      memberCount: apiGroup.memberCount,
      postCount: apiGroup.postCount,
      tag: apiGroup.tags.map((t) => t.name),
      tags: apiGroup.tags.map((t) => t.name), // For backward compatibility
      createdAt: new Date(apiGroup.createdAt),
      isPrivate: false, // Default as API doesn't provide this
      ownerId: apiGroup.ownerId,
      members: [], // Default as API doesn't provide this
    }

    return group
  },

  // New: Search/Filter groups via backend (with graceful fallback to mock)
  async searchGroups(params: {
    q?: string
    filter?: string
    page?: number
    limit?: number
    sort?: string
  }): Promise<{ items: Group[]; page: number; pageSize: number; total: number }> {
    const { q = "", filter = "all", page = 1, limit = 12 } = params

    // Try real backend first
    try {
      const url = new URL(`${API_BASE}/groups/search`)
      if (q) {
        url.searchParams.set("q", q)
        // Đồng thời truyền name để BE có thể match theo tên nếu hỗ trợ
        url.searchParams.set("name", q)
      }
      url.searchParams.set("page", String(page))
      url.searchParams.set("limit", String(limit))
      // If backend supports sort/filter, pass through conservatively
      if (filter === "public") url.searchParams.set("privacy", "public")
      if (filter === "private") url.searchParams.set("privacy", "private")

      const token = tokenManager.getToken()
      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      })

      const data = await res.json()
      if (!res.ok) throw new Error((data && (data.message || data.error)) || "Search groups failed")

      // Accept multiple possible shapes: data.items | items | results
      const items: Group[] = (data?.data?.items || data?.items || data?.results || []) as Group[]
      const total: number = (data?.data?.total || data?.total || items.length) as number
      return { items, page, pageSize: limit, total }
    } catch (e) {
      // Fallback to mock filtering so UI still works offline
      let items = [...mockGroups]
      if (q.trim()) {
        items = items.filter(
          (g) =>
            g.name.toLowerCase().includes(q.toLowerCase()) ||
            g.description.toLowerCase().includes(q.toLowerCase()) ||
            (g.tags &&
              g.tags.some((t) => {
                const tagStr = typeof t === "string" ? t : t.name
                return tagStr.toLowerCase().includes(q.toLowerCase())
              }))
        )
      }
      if (filter === "public") items = items.filter((g) => !g.isPrivate)
      if (filter === "private") items = items.filter((g) => g.isPrivate)
      if (filter === "recent") {
        items = items.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
          return dateB.getTime() - dateA.getTime()
        })
      }
      if (filter === "popular") items = items.sort((a, b) => b.memberCount - a.memberCount)
      const total = items.length
      const start = (page - 1) * limit
      const paged = items.slice(start, start + limit)
      return { items: paged, page, pageSize: limit, total }
    }
  },

  // Search groups by keyword using GET with query parameter
  async searchGroupsByKeyword(
    keyword: string,
    page: number = 1,
    limit: number = 18,
    decayFactor: number = 0.05
  ): Promise<{ groups: Group[]; hasMore: boolean; total: number }> {
    const token = tokenManager.getToken()
    const url = new URL(`${API_BASE}/groups/search`)
    url.searchParams.set("page", String(page))
    url.searchParams.set("limit", String(limit))
    url.searchParams.set("decayFactor", String(decayFactor))
    url.searchParams.set("keyword", keyword)

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || "Tìm kiếm nhóm thất bại")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid groups search data structure:", data)
      return {
        groups: [],
        hasMore: false,
        total: 0,
      }
    }

    // Transform API data to match frontend interface
    const groups = data.data.items.map((group: any) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description || "",
      coverImage: group.coverImage,
      avatar: group.avatar,
      ownerId: group.ownerId,
      memberCount: group.memberCount || 0,
      postCount: group.postCount || 0,
      createdAt: new Date(group.createdAt),
      tags: (group.tags || []).filter((tag: any) => tag && tag.name).map((tag: any) => tag.name),
      tag: (group.tags || []).filter((tag: any) => tag && tag.name).map((tag: any) => tag.name),
      isPrivate: false,
      members: [],
      userRole: group.isJoined ? "member" : null,
      joinStatus: group.isJoined ? "joined" : "not-joined",
    }))

    return {
      groups,
      hasMore: data.data.hasMore || false,
      total: data.data.items.length, // heuristics if total not provided at top level
    }
  },

  // Get joined groups for current user
  async getJoinedGroups(
    page: number = 1,
    limit: number = 10
  ): Promise<{ groups: Group[]; hasMore: boolean; total: number }> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/groups/joined?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || "Không thể tải danh sách nhóm đã tham gia")
    }

    // Check if data structure is valid (try both old format data.data.groups and new format data.items)
    const items = data.data?.items || data.data?.groups
    if (!items || !Array.isArray(items)) {
      console.warn("Invalid groups data structure:", data)
      return {
        groups: [],
        hasMore: false,
        total: 0,
      }
    }

    // Transform API data to match frontend interface
    const groups = items.map((group: any) => {
      const processedTags = (group.tags || group.tag || [])
        .filter((tag: any) => tag && (typeof tag === "string" ? tag : tag.name))
        .map((tag: any) => (typeof tag === "string" ? tag : tag.name))
      return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description || "",
        coverImage: group.coverImage,
        avatar: group.avatar,
        ownerId: group.ownerId,
        memberCount: group.memberCount || 0,
        postCount: group.postCount || 0,
        createdAt: new Date(group.createdAt),
        tags: processedTags,
        tag: processedTags, // Keep for backward compatibility
        isPrivate: false,
        members: [],
        userRole: "member" as const,
        joinStatus: "joined" as const,
      }
    })

    return {
      groups,
      hasMore: data.data?.hasMore || false,
      total: data.data?.total || items.length,
    }
  },

  // Get trending groups
  async getTrendingGroups(
    page: number = 1,
    limit: number = 18,
    decayFactor: number = 0.05
  ): Promise<{ groups: Group[]; hasMore: boolean; total: number }> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/groups/trending?page=${page}&limit=${limit}&decayFactor=${decayFactor}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || "Không thể tải danh sách nhóm phổ biến")
    }

    // Check if data structure is valid
    const items = data.data?.items
    if (!items || !Array.isArray(items)) {
      console.warn("Invalid trending groups data structure:", data)
      return {
        groups: [],
        hasMore: false,
        total: 0,
      }
    }

    // Transform API data to match frontend interface
    const groups: Group[] = items.map((group: any) => {
      const processedTags = (group.tags || group.tag || [])
        .filter((tag: any) => tag && (typeof tag === "string" ? tag : tag.name))
        .map((tag: any) => (typeof tag === "string" ? tag : tag.name))
      return {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description || "",
        coverImage: group.coverImage,
        avatar: group.avatar,
        ownerId: group.ownerId,
        memberCount: group.memberCount || 0,
        postCount: group.postCount || 0,
        createdAt: new Date(group.createdAt),
        tags: processedTags,
        tag: processedTags, // Keep for backward compatibility
        isPrivate: false,
        members: [],
        userRole: (group.isJoined ? "member" : null) as "member" | "owner" | "mod" | null,
        joinStatus: (group.isJoined ? "joined" : "not-joined") as "joined" | "pending" | "not-joined",
      }
    })

    return {
      groups,
      hasMore: data.data?.hasMore || false,
      total: items.length,
    }
  },

  async getGroup(id: string): Promise<Group | null> {
    try {
      const token = tokenManager.getToken()
      const res = await fetch(`${API_BASE}/groups/${id}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!res.ok) {
        console.error("Failed to fetch group:", res.status)
        return null
      }

      const data = await res.json()

      if (!data.success || !data.data) {
        return null
      }

      // Transform API response to Group interface
      const apiGroup = data.data
      const group: Group = {
        id: apiGroup.id,
        name: apiGroup.name,
        slug: apiGroup.slug,
        description: apiGroup.description,
        coverImage: apiGroup.coverImage,
        avatar: apiGroup.avatar,
        memberCount: apiGroup.memberCount,
        postCount: apiGroup.postCount,
        ownerId: apiGroup.ownerId,
        createdAt: apiGroup.createdAt,
        // Transform tags array - handle both string[] and object[] formats
        tag: Array.isArray(apiGroup.tags)
          ? apiGroup.tags.map((t: any) => (typeof t === "string" ? t : t.name.replace(/^#/, "")))
          : [],
        tags: apiGroup.tags, // Keep original format
        isPrivate: false,
        userRole: null,
        joinStatus: apiGroup.isJoined ? "joined" : "not-joined",
      }

      return group
    } catch (error) {
      console.error("Error fetching group:", error)
      return null
    }
  },

  async updateGroup(
    groupId: string,
    data: { name: string; description: string; tags: string[]; avatar?: string }
  ): Promise<Group | null> {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        throw new Error("Unauthorized: No token found")
      }

      const res = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to update group")
      }

      const response = await res.json()

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to update group")
      }

      // Transform API response to Group interface
      const apiGroup = response.data
      const group: Group = {
        id: apiGroup.id,
        name: apiGroup.name,
        slug: apiGroup.slug,
        description: apiGroup.description,
        coverImage: apiGroup.coverImage,
        avatar: apiGroup.avatar,
        memberCount: apiGroup.memberCount,
        postCount: apiGroup.postCount,
        ownerId: apiGroup.ownerId,
        createdAt: apiGroup.createdAt,
        tag: Array.isArray(apiGroup.tags)
          ? apiGroup.tags.map((t: any) => (typeof t === "string" ? t : t.name.replace(/^#/, "")))
          : [],
        tags: apiGroup.tags,
        isPrivate: false,
        userRole: "owner",
        joinStatus: "joined",
      }

      return group
    } catch (error) {
      console.error("Error updating group:", error)
      throw error
    }
  },

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        throw new Error("Unauthorized: No token found")
      }

      const res = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to delete group")
      }

      const response = await res.json()

      if (!response.success) {
        throw new Error(response.message || "Failed to delete group")
      }
    } catch (error) {
      console.error("Error deleting group:", error)
      throw error
    }
  },

  async shareGroup(groupId: string): Promise<string | null> {
    try {
      const token = tokenManager.getToken()
      const res = await fetch(`${API_BASE}/groups/${groupId}/share`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to get share link")
      }

      const response = await res.json()

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to get share link")
      }

      return response.data.url
    } catch (error) {
      console.error("Error sharing group:", error)
      return null
    }
  },

  async joinGroup(groupId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/group-members/${groupId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể tham gia nhóm")
    }
  },

  async leaveGroup(groupId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/group-members/${groupId}/leave`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể rời khỏi nhóm")
    }
  },

  // Group Members
  async getGroupMembers(groupId: string): Promise<User[]> {
    try {
      const token = tokenManager.getToken()
      const res = await fetch(`${API_BASE}/group-members/${groupId}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!res.ok) {
        console.error("Failed to fetch group members:", res.status)
        return []
      }

      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) return []

      const members: User[] = data.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: "", // not provided
        displayName: u.displayName || u.displayname || u.username,
        avatar: u.avatar ?? null,
        bio: u.bio ?? "",
        points: u.points ?? 0,
        level: u.level ?? 1,
        badges: [],
        followers: u.followersCount || u.followerscount || 0,
        following: u.followingCount || u.followingcount || 0,
        followersCount: u.followersCount || u.followerscount || 0,
        followingCount: u.followingCount || u.followingcount || 0,
        joinedAt: new Date(),
        isOnline: u.isOnline ?? u.isonline ?? false,
        profileVisibility: u.profileVisibility || u.profilevisibility,
        isFollowing: u.isFollowing ?? false,
      }))

      return members
    } catch (error) {
      console.error("Error fetching group members:", error)
      return []
    }
  },

  // Kick member from group (owner only)
  async kickGroupMember(groupId: string, userId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/group-members/${groupId}/members/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể kick thành viên khỏi nhóm")
    }
  },

  async getBannedMembers(groupId: string): Promise<User[]> {
    try {
      const token = tokenManager.getToken()
      const res = await fetch(`${API_BASE}/group-members/${groupId}/banned`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        return []
      }

      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) return []

      return data.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        email: "",
        displayName: u.displayName || u.displayname || u.username,
        avatar: u.avatar ?? null,
        bio: u.bio ?? "",
        points: u.points ?? 0,
        level: u.level ?? 1,
        badges: [],
        followers: u.followersCount || 0,
        following: u.followingCount || 0,
        followersCount: u.followersCount || 0,
        followingCount: u.followingCount || 0,
        joinedAt: new Date(),
        isOnline: u.isOnline ?? false,
        profileVisibility: u.profileVisibility,
        isFollowing: u.isFollowing ?? false,
      }))
    } catch (error) {
      console.error("Error fetching banned members:", error)
      return []
    }
  },

  async banGroupMember(groupId: string, userId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/group-members/${groupId}/members/${userId}/ban`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể ban thành viên")
    }
  },

  async unbanGroupMember(groupId: string, userId: string): Promise<void> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/group-members/${groupId}/members/${userId}/unban`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể unban thành viên")
    }
  },

  // Posts
  async getPosts(groupId?: string): Promise<Post[]> {
    await delay(600)
    return groupId ? mockPosts.filter((p) => p.groupId === groupId) : mockPosts
  },

  async getFeedPosts(
    page: number = 1,
    limit: number = 10,
    decayFactor: number = 1
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/posts/feed/all?page=${page}&limit=${limit}&decayFactor=${decayFactor}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể tải bài viết")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid feed posts data structure:", data)
      return { posts: [], hasMore: false }
    }

    // Transform API data to match Post interface
    const posts: Post[] = data.data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      slug: item.slug || undefined,
      excerpt: item.excerpt || undefined,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName,
        avatar: item.author.avatar,
        email: "",
        points: 0,
        level: 1,
        badges: [],
        followers: 0,
        following: 0,
        joinedAt: new Date(),
      },
      groupId: item.group?.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      tags: item.tags?.map((tag: any) => tag.name || tag) || [],
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }))

    return {
      posts,
      hasMore: data.data.hasMore || false,
    }
  },

  async getTrendingPosts(
    page: number = 1,
    limit: number = 10,
    decayFactor: number = 1
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/posts/feed/trending?page=${page}&limit=${limit}&decayFactor=${decayFactor}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể tải bài viết thịnh hành")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid trending posts data structure:", data)
      return { posts: [], hasMore: false }
    }

    // Transform API data to match Post interface (same as getFeedPosts)
    const posts: Post[] = data.data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      slug: item.slug || undefined,
      excerpt: item.excerpt || undefined,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName,
        avatar: item.author.avatar,
        email: "",
        points: 0,
        level: 1,
        badges: [],
        followers: 0,
        following: 0,
        joinedAt: new Date(),
      },
      groupId: item.group?.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      tags: item.tags?.map((tag: any) => tag.name || tag) || [],
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }))

    return {
      posts,
      hasMore: data.data.hasMore || false,
    }
  },

  async getFollowingPosts(
    page: number = 1,
    limit: number = 10,
    decayFactor: number = 1
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/posts/feed/following?page=${page}&limit=${limit}&decayFactor=${decayFactor}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || "Không thể tải bài viết từ người theo dõi")
    }

    // Check if data structure is valid
    if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
      console.warn("Invalid following posts data structure:", data)
      return { posts: [], hasMore: false }
    }

    // Transform API data to match Post interface (same as getFeedPosts & getTrendingPosts)
    const posts: Post[] = data.data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      slug: item.slug || undefined,
      excerpt: item.excerpt || undefined,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName,
        avatar: item.author.avatar,
        email: "",
        points: 0,
        level: 1,
        badges: [],
        followers: 0,
        following: 0,
        joinedAt: new Date(),
      },
      groupId: item.group?.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      tags: item.tags?.map((tag: any) => tag.name || tag) || [],
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }))

    return {
      posts,
      hasMore: data.data.hasMore || false,
    }
  },

  async getGroupPosts(
    groupId: string,
    page: number = 1,
    limit: number = 10,
    decayFactor: number = 1
  ): Promise<{ posts: Post[]; hasMore: boolean }> {
    try {
      const token = tokenManager.getToken()
      const response = await fetch(
        `${API_BASE}/posts/by-group/${groupId}?page=${page}&limit=${limit}&decayFactor=${decayFactor}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      )

      if (!response.ok) {
        // If unauthorized, forbidden, or not found, return empty posts instead of throwing
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          console.log(`Group posts not accessible (status ${response.status}), returning empty array`)
          return { posts: [], hasMore: false }
        }
        // For other errors, log but still return empty to avoid breaking the page
        console.error(`Failed to load group posts (status ${response.status})`)
        return { posts: [], hasMore: false }
      }

      const data = await response.json()

      // Check if data structure is valid
      if (!data.data || !data.data.items || !Array.isArray(data.data.items)) {
        console.log("Invalid data structure for group posts, returning empty array")
        return { posts: [], hasMore: false }
      }

      // Transform BE data to frontend Post interface
      const posts: Post[] = data.data.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        excerpt: item.excerpt || item.content.substring(0, 200),
        slug: item.slug,
        authorId: item.author.id,
        author: {
          id: item.author.id,
          username: item.author.username,
          displayName: item.author.displayName || item.author.username,
          name: item.author.displayName || item.author.username,
          email: "",
          avatar: item.author.avatar || "/placeholder-user.jpg",
          bio: "",
          location: "",
          website: "",
          followers: 0,
          following: 0,
          joinedAt: new Date(),
        },
        group: item.group
          ? {
              id: item.group.id,
              name: item.group.name,
              slug: item.group.slug,
              description: "",
              memberCount: 0,
              postCount: 0,
              tag: [],
              tags: [],
              createdAt: new Date(),
            }
          : undefined,
        tags: item.tags?.map((tag: any) => tag.name || tag) || [],
        reactions: item.reactions || [],
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        isLiked: item.isLiked || false,
        attachments: [],
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))

      return {
        posts,
        hasMore: data.data.hasMore || false,
      }
    } catch (error) {
      console.error("Error loading group posts:", error)
      return { posts: [], hasMore: false }
    }
  },

  async getPost(id: string): Promise<Post | null> {
    const token = tokenManager.getToken()
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể tải bài viết")
    }

    const result = await response.json()
    const item = result.data

    // Transform BE data to frontend Post interface
    const post: Post = {
      id: item.id,
      title: item.title,
      content: item.content,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName || item.author.username,
        email: "",
        avatar: item.author.avatar || "/placeholder-user.jpg",
        bio: "",
        location: "",
        website: "",
        followers: 0,
        following: 0,
        points: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
      },
      authorId: item.author.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      groupId: item.group?.id,
      tags: transformTags(item.tags),
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }

    return post
  },

  async createPost(data: { title: string; content: string; tags?: string[]; groupId?: string }): Promise<Post> {
    const requestBody: any = {
      title: data.title,
      content: data.content,
      tags: data.tags || [],
    }

    // Add groupId if provided (for group posts)
    if (data.groupId) {
      requestBody.groupId = data.groupId
    }

    const response = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể tạo bài viết")
    }

    const result = await response.json()
    const item = result.data

    // Transform BE data to frontend Post interface
    const post: Post = {
      id: item.id,
      title: item.title,
      content: item.content,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName || item.author.username,
        email: "",
        avatar: item.author.avatar || "/placeholder-user.jpg",
        bio: "",
        location: "",
        website: "",
        followers: 0,
        following: 0,
        points: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
      },
      authorId: item.author.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      groupId: item.group?.id,
      tags: item.tags?.map((tag: any) => tag.name || tag) || [],
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }

    return post
  },

  async updatePost(
    id: string,
    data: {
      title: string
      content: string
      tags?: string[]
    }
  ): Promise<Post> {
    const requestBody = {
      title: data.title,
      content: data.content,
      tags: data.tags || [],
    }

    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể cập nhật bài viết")
    }

    const result = await response.json()
    const item = result.data

    // Transform BE data to frontend Post interface
    const post: Post = {
      id: item.id,
      title: item.title,
      content: item.content,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName || item.author.username,
        email: "",
        avatar: item.author.avatar || "/placeholder-user.jpg",
        bio: "",
        location: "",
        website: "",
        followers: 0,
        following: 0,
        points: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
      },
      authorId: item.author.id,
      group: item.group
        ? {
            id: item.group.id,
            name: item.group.name,
            slug: item.group.slug,
            description: "",
            memberCount: 0,
            postCount: 0,
            tag: [],
            tags: [],
            createdAt: new Date(),
          }
        : undefined,
      groupId: item.group?.id,
      tags: transformTags(item.tags),
      reactions: item.reactions || [],
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      isLiked: item.isLiked || false,
      attachments: [],
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }

    return post
  },

  async deletePost(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể xóa bài viết")
    }
  },

  async toggleReaction(
    targetId: string,
    reactionType: string = "like",
    targetType: "post" | "comment" = "post"
  ): Promise<{ action: "added" | "removed"; likeCount?: number }> {
    const response = await fetch(`${API_BASE}/reactions/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
      body: JSON.stringify({
        targetType,
        targetId,
        type: reactionType,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể cập nhật reaction")
    }

    const result = await response.json()
    return {
      action: result.data.action,
      likeCount: result.data.likeCount,
    }
  },

  async likePost(postId: string): Promise<void> {
    await delay(200)
  },

  async unlikePost(postId: string): Promise<void> {
    await delay(200)
  },

  // Bookmarks
  async bookmarkPost(postId: string): Promise<{
    id: string
    createdAt: string
    post: {
      id: string
      title: string
      slug: string
      excerpt: string
      author: {
        id: string
        username: string
        displayName: string
        avatar: string | null
      }
    }
  }> {
    const response = await fetch(`${API_BASE}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
      body: JSON.stringify({ postId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể lưu bài viết")
    }

    const result = await response.json()
    return result.data
  },

  async unbookmarkPost(postId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/bookmarks/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể bỏ lưu bài viết")
    }
  },

  async getBookmarkedPosts(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    items: Array<{
      id: string
      createdAt: string
      post: {
        id: string
        title: string
        slug: string
        excerpt: string
        author: {
          id: string
          username: string
          displayName: string
          avatar: string | null
        }
      }
    }>
    hasMore: boolean
  }> {
    const response = await fetch(`${API_BASE}/bookmarks/me?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể tải danh sách bài viết đã lưu")
    }

    const result = await response.json()
    return result.data
  },

  // Comments
  async getComments(
    postId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ comments: Comment[]; hasMore: boolean }> {
    const token = tokenManager.getToken()
    const headers: HeadersInit = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}/comments?page=${page}&limit=${limit}&postId=${postId}`, {
      headers,
    })

    if (!response.ok) {
      throw new Error("Không thể tải bình luận")
    }

    const result = await response.json()
    const items = result.data.items

    // Transform BE data to frontend Comment interface
    const transformComment = (item: any): Comment => ({
      id: item.id,
      content: item.content,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName || item.author.username,
        email: "",
        avatar: item.author.avatar || "/placeholder-user.jpg",
        bio: "",
        location: "",
        website: "",
        followers: 0,
        following: 0,
        points: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
      },
      postId,
      parentId: item.parentId || undefined,
      replyToCommentId: item.replyToCommentId || undefined,
      replyToUser: item.replyToUser
        ? {
            id: item.replyToUser.id,
            username: item.replyToUser.username,
            displayName: item.replyToUser.displayName || item.replyToUser.username,
            avatar: item.replyToUser.avatar || "/placeholder-user.jpg",
          }
        : undefined,
      replies: item.replies?.map(transformComment) || [],
      reactions: [],
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      isLiked: false,
      likeCount: item.likeCount || 0,
      likes: item.likeCount || 0,
    })

    const comments: Comment[] = items.map(transformComment)

    return {
      comments,
      hasMore: result.data.hasMore || false,
    }
  },

  async createComment(postId: string, content: string, replyToCommentId?: string): Promise<Comment> {
    const requestBody: any = {
      postId,
      content,
    }

    // Only include replyToCommentId if it's provided
    if (replyToCommentId) {
      requestBody.replyToCommentId = replyToCommentId
    }

    const response = await fetch(`${API_BASE}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể tạo bình luận")
    }

    const result = await response.json()
    const item = result.data

    // Transform BE data to frontend Comment interface
    const comment: Comment = {
      id: item.id,
      content: item.content,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName || item.author.username,
        email: "",
        avatar: item.author.avatar || "/placeholder-user.jpg",
        bio: "",
        location: "",
        website: "",
        followers: 0,
        following: 0,
        points: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
      },
      postId,
      parentId: item.parentId || undefined,
      replyToCommentId: item.replyToCommentId,
      replyToUser: item.replyToUser,
      replies: item.replies || [],
      reactions: [],
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      isLiked: false,
      likeCount: item.likeCount || 0,
      likes: item.likeCount || 0,
    }

    return comment
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể cập nhật bình luận")
    }

    const result = await response.json()
    const item = result.data

    // Transform BE data to frontend Comment interface
    const comment: Comment = {
      id: item.id,
      content: item.content,
      authorId: item.author.id,
      author: {
        id: item.author.id,
        username: item.author.username,
        displayName: item.author.displayName || item.author.username,
        email: "",
        avatar: item.author.avatar || "/placeholder-user.jpg",
        bio: "",
        location: "",
        website: "",
        followers: 0,
        following: 0,
        points: 0,
        level: 1,
        badges: [],
        joinedAt: new Date(),
      },
      postId: "", // Will be set by the component
      parentId: item.parentId || undefined,
      replyToCommentId: item.replyToCommentId || undefined,
      replyToUser: item.replyToUser
        ? {
            id: item.replyToUser.id,
            username: item.replyToUser.username,
            displayName: item.replyToUser.displayName || item.replyToUser.username,
            avatar: item.replyToUser.avatar || "/placeholder-user.jpg",
          }
        : undefined,
      replies:
        item.replies?.map((reply: any) => ({
          ...reply,
          author: {
            ...reply.author,
            avatar: reply.author.avatar || "/placeholder-user.jpg",
          },
        })) || [],
      reactions: [],
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      isLiked: false,
      likeCount: item.likeCount || 0,
      likes: item.likeCount || 0,
    }

    return comment
  },

  async deleteComment(commentId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${tokenManager.getToken()}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Không thể xóa bình luận")
    }
  },

  // Chat - Real API calls
  async getChatThreads(): Promise<ChatThread[]> {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const conversations = data.data || data

      // Transform backend conversations to ChatThread format
      return conversations.map((conv: any) => {
        const participants = conv.participants || []

        // Lấy lastMessage từ backend (nếu có populate) hoặc tạo default
        let lastMessage: {
          id: string
          content: string
          timestamp: Date
          senderId: string
        }

        if (conv.lastMessage) {
          // Backend đã populate lastMessage
          lastMessage = {
            id: conv.lastMessage.id || conv.lastMessageId || "",
            content: conv.lastMessage.content || "",
            timestamp: conv.lastMessage.createdAt
              ? new Date(conv.lastMessage.createdAt)
              : conv.lastActivityAt
                ? new Date(conv.lastActivityAt)
                : new Date(conv.createdAt || Date.now()),
            senderId: conv.lastMessage.senderId || conv.lastMessage.sender?.id || "",
          }
        } else if (conv.lastMessageId) {
          // Chỉ có lastMessageId, không có content
          lastMessage = {
            id: conv.lastMessageId,
            content: "Chưa có tin nhắn",
            timestamp: conv.lastActivityAt ? new Date(conv.lastActivityAt) : new Date(conv.createdAt || Date.now()),
            senderId: "",
          }
        } else {
          // Không có lastMessage
          lastMessage = {
            id: "",
            content: "Chưa có tin nhắn",
            timestamp: new Date(conv.createdAt || Date.now()),
            senderId: "",
          }
        }

        // Lấy unreadCount từ conversation (backend đã populate sẵn từ participant của currentUser)
        const unreadCount = conv.unreadCount !== undefined ? conv.unreadCount : 0

        return {
          id: conv.id,
          type: conv.type || "direct",
          participants: participants.map((p: any) => ({
            id: p.userId || p.user?.id || "",
            name: p.user?.displayName || p.user?.username || "",
            displayName: p.user?.displayName || p.user?.username || "",
            avatar: p.user?.avatar || null,
            isOnline: p.user?.isOnline || false,
          })),
          lastMessage,
          unreadCount,
          groupId: conv.groupId,
          name: conv.name,
        }
      })
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
      // Fallback to mock data
      await delay(400)
      return mockChatThreads
    }
  },

  async getConversationByGroupId(groupId: string): Promise<ChatThread | null> {
    const token = tokenManager.getToken()
    if (!token) throw new Error("Token không tồn tại")

    try {
      const response = await fetch(`${API_BASE}/conversations/groups/${groupId}/conversation`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const conv = result.data || result

      // Transform single conversation to ChatThread
      const participants = conv.participants || []

      let lastMessage: {
        id: string
        content: string
        timestamp: Date
        senderId: string
      }

      if (conv.lastMessage) {
        lastMessage = {
          id: conv.lastMessage.id || conv.lastMessageId || "",
          content: conv.lastMessage.content || "",
          timestamp: conv.lastMessage.createdAt
            ? new Date(conv.lastMessage.createdAt)
            : conv.lastActivityAt
              ? new Date(conv.lastActivityAt)
              : new Date(conv.createdAt || Date.now()),
          senderId: conv.lastMessage.senderId || conv.lastMessage.sender?.id || "",
        }
      } else {
        lastMessage = {
          id: "",
          content: "Chưa có tin nhắn",
          timestamp: new Date(conv.createdAt || Date.now()),
          senderId: "",
        }
      }

      const unreadCount = conv.unreadCount !== undefined ? conv.unreadCount : 0

      return {
        id: conv.id,
        type: conv.type || "direct",
        participants: participants.map((p: any) => ({
          id: p.userId || p.user?.id || "",
          name: p.user?.displayName || p.user?.username || "",
          displayName: p.user?.displayName || p.user?.username || "",
          avatar: p.user?.avatar || null,
          isOnline: p.user?.isOnline || false,
        })),
        lastMessage,
        unreadCount,
        groupId: conv.groupId,
        name: conv.name,
      }
    } catch (error) {
      console.error("Failed to fetch group conversation:", error)
      return null
    }
  },

  async getChatMessages(threadId: string): Promise<ChatMessage[]> {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    try {
      const response = await fetch(`${API_BASE}/messages/conversations/${threadId}?limit=50&offset=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const messages = data.data || data

      // Transform backend messages to ChatMessage format
      return messages.map((msg: any) => ({
        id: msg.id,
        threadId: msg.conversationId,
        conversationId: msg.conversationId,
        senderId: msg.senderId || msg.sender?.id || "",
        sender: msg.sender
          ? {
              id: msg.sender.id,
              displayName: msg.sender.displayName || msg.sender.username || "",
              username: msg.sender.username || "",
              avatar: msg.sender.avatar || null,
            }
          : undefined,
        content: msg.content || "",
        type: msg.type || "text",
        timestamp: new Date(msg.createdAt || Date.now()),
        createdAt: new Date(msg.createdAt || Date.now()),
        isRead: true, // TODO: Implement read status from participants
        replyToId: msg.replyToId,
        replyTo: msg.replyTo
          ? {
              id: msg.replyTo.id,
              conversationId: msg.replyTo.conversationId,
              senderId: msg.replyTo.senderId,
              sender: msg.replyTo.sender
                ? {
                    id: msg.replyTo.sender.id,
                    displayName: msg.replyTo.sender.displayName || msg.replyTo.sender.username || "",
                    username: msg.replyTo.sender.username || "",
                    avatar: msg.replyTo.sender.avatar || null,
                  }
                : undefined,
              content: msg.replyTo.content,
              type: msg.replyTo.type,
              createdAt: new Date(msg.replyTo.createdAt),
            }
          : undefined,
      }))
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      // Không fallback về mock data, throw error để frontend xử lý
      throw error
    }
  },

  async createConversation(participantIds: string[]): Promise<ChatThread> {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: "direct",
          participantIds,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const conversation = data.data || data

      // Transform backend conversation to ChatThread format
      const participants = conversation.participants || []
      let lastMessage: {
        id: string
        content: string
        timestamp: Date
        senderId: string
      }

      if (conversation.lastMessage) {
        lastMessage = {
          id: conversation.lastMessage.id || conversation.lastMessageId || "",
          content: conversation.lastMessage.content || "",
          timestamp: conversation.lastMessage.createdAt
            ? new Date(conversation.lastMessage.createdAt)
            : conversation.lastActivityAt
              ? new Date(conversation.lastActivityAt)
              : new Date(conversation.createdAt || Date.now()),
          senderId: conversation.lastMessage.senderId || conversation.lastMessage.sender?.id || "",
        }
      } else {
        lastMessage = {
          id: "",
          content: "Chưa có tin nhắn",
          timestamp: new Date(conversation.createdAt || Date.now()),
          senderId: "",
        }
      }

      return {
        id: conversation.id,
        type: conversation.type || "direct",
        participants: participants.map((p: any) => ({
          id: p.userId || p.user?.id || "",
          name: p.user?.displayName || p.user?.username || "",
          displayName: p.user?.displayName || p.user?.username || "",
          avatar: p.user?.avatar || null,
          isOnline: p.user?.isOnline || false,
        })),
        lastMessage,
        unreadCount: conversation.unreadCount !== undefined ? conversation.unreadCount : 0,
      }
    } catch (error) {
      console.error("Failed to create conversation:", error)
      throw error
    }
  },

  async sendMessage(
    message: Omit<ChatMessage, "id" | "sender"> & { sender?: ChatMessage["sender"] }
  ): Promise<ChatMessage> {
    // Note: Real-time messages should be sent via Socket.IO
    // This REST API endpoint is available as fallback
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          conversationId: message.conversationId,
          content: message.content,
          type: message.type || "text",
          replyToId: (message as any).replyToId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const msg = data.data || data

      return {
        id: msg.id,
        threadId: msg.conversationId,
        conversationId: msg.conversationId,
        senderId: msg.senderId || msg.sender?.id || "",
        sender: msg.sender
          ? {
              id: msg.sender.id,
              username: msg.sender.username || "",
              email: msg.sender.email || "",
              displayName: msg.sender.displayName || msg.sender.username || "",
              avatar: msg.sender.avatar || null,
              points: msg.sender.points || 0,
              level: msg.sender.level || 1,
              badges: msg.sender.badges || [],
              followers: msg.sender.followers || msg.sender.followersCount || 0,
              following: msg.sender.following || msg.sender.followingCount || 0,
              joinedAt: msg.sender.joinedAt ? new Date(msg.sender.joinedAt) : new Date(),
              bio: msg.sender.bio,
              location: msg.sender.location,
              website: msg.sender.website,
              linkedin: msg.sender.linkedin,
              github: msg.sender.github,
              experiencePoints: msg.sender.experiencePoints,
              postsCount: msg.sender.postsCount,
              groupsCount: msg.sender.groupsCount,
              experienceLevel: msg.sender.experienceLevel,
              profileVisibility: msg.sender.profileVisibility,
              isFollowing: msg.sender.isFollowing,
              isOnline: msg.sender.isOnline,
            }
          : {
              id: msg.senderId || "",
              username: "",
              email: "",
              displayName: "",
              avatar: null,
              points: 0,
              level: 1,
              badges: [],
              followers: 0,
              following: 0,
              joinedAt: new Date(),
            },
        content: msg.content || "",
        type: msg.type || "text",
        timestamp: new Date(msg.createdAt || Date.now()),
        createdAt: new Date(msg.createdAt || Date.now()),
        isRead: true,
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Fallback to mock
      await delay(200)
      const newMessage: ChatMessage = {
        ...message,
        sender: message.sender || {
          id: message.senderId || "",
          username: "",
          email: "",
          displayName: "",
          avatar: null,
          points: 0,
          level: 1,
          badges: [],
          followers: 0,
          following: 0,
          joinedAt: new Date(),
        },
        id: Date.now().toString(),
      }
      if (!mockChatMessages[message.threadId]) {
        mockChatMessages[message.threadId] = []
      }
      mockChatMessages[message.threadId].push(newMessage)
      return newMessage
    }
  },

  async getConversations(): Promise<Conversation[]> {
    // Alias for getChatThreads but return Conversation format
    const threads = await this.getChatThreads()
    return threads.map((thread) => ({
      id: thread.id,
      type: thread.participants.length > 2 ? "group" : "direct",
      name:
        thread.participants.length > 2
          ? thread.participants.map((p) => p.displayName).join(", ")
          : thread.participants[0]?.displayName || "",
      participants: thread.participants.map((p) => ({
        id: p.id,
        username: p.name || "",
        displayName: p.displayName || p.name || "",
        avatar: p.avatar || null,
        email: "",
        points: 0,
        level: 1,
        bio: null,
        location: null,
        website: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as any, // Type assertion needed due to type mismatch
      lastMessage: thread.lastMessage
        ? {
            id: thread.lastMessage.id,
            threadId: thread.id,
            content: thread.lastMessage.content,
            senderId: thread.lastMessage.senderId,
            sender: {
              id: thread.lastMessage.senderId,
              displayName: "",
              username: "",
              avatar: null,
              email: "",
              points: 0,
              level: 1,
              bio: null,
              location: null,
              website: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            conversationId: thread.id,
            type: "text" as const,
            timestamp: thread.lastMessage.timestamp,
            createdAt: thread.lastMessage.timestamp,
            isRead: true,
          }
        : undefined,
      unreadCount: thread.unreadCount,
      createdAt: (thread as any).createdAt || new Date(),
      updatedAt: (thread as any).updatedAt || new Date(),
    }))
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    // Alias for getChatMessages
    return this.getChatMessages(conversationId)
  },

  async sendChatMessage(conversationId: string, content: string): Promise<ChatMessage> {
    // Alias for sendMessage
    return this.sendMessage({
      threadId: conversationId,
      conversationId,
      content,
      senderId: "current-user", // Will be replaced by backend
      type: "text",
      timestamp: new Date(),
      createdAt: new Date(),
      isRead: false,
    })
  },

  // Gamification
  async getBadges(status: "all" | "earned" | "unearned" = "all"): Promise<Badge[]> {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        throw new Error("Chưa đăng nhập")
      }

      const url = `${API_BASE}/badges?status=${status}`
      console.log("Fetching badges from:", url)

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Badges response status:", res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Không thể tải danh sách huy hiệu: ${res.status} ${res.statusText}`)
      }

      const response: {
        statusCode: number
        success: boolean
        message: string
        data: Array<{
          id: string
          name: string
          slug: string
          description: string
          rarity: "common" | "rare" | "epic" | "legendary"
          pointsRequired: number
          isEarned: boolean
          earnedAt: string | null
        }>
      } = await res.json()

      console.log("Badges response:", response)

      if (!response.success) {
        throw new Error(response.message || "Không thể tải danh sách huy hiệu")
      }

      // Map backend data to frontend Badge type
      const badges: Badge[] = response.data.map((badge) => ({
        id: badge.id,
        name: badge.name,
        slug: badge.slug,
        description: badge.description,
        rarity: badge.rarity,
        pointsRequired: badge.pointsRequired,
        isEarned: badge.isEarned,
        earnedAt: badge.earnedAt ? new Date(badge.earnedAt) : null,
        // Add default values for optional fields
        icon: this.getBadgeIcon(badge.rarity),
        color: this.getBadgeColor(badge.rarity),
        progress: badge.isEarned ? 100 : 0,
      }))

      return badges
    } catch (error) {
      console.error("Error fetching badges:", error)
      throw error
    }
  },

  getBadgeIcon(rarity: string): string {
    const icons: Record<string, string> = {
      common: "🌟",
      rare: "⭐",
      epic: "🔥",
      legendary: "🏆",
    }
    return icons[rarity] || "🎖️"
  },

  getBadgeColor(rarity: string): string {
    const colors: Record<string, string> = {
      common: "gray",
      rare: "blue",
      epic: "purple",
      legendary: "yellow",
    }
    return colors[rarity] || "gray"
  },

  async getBadgeSummary(): Promise<{
    totalBadges: number
    earnedBadges: number
    notEarnedBadges: number
    completionRate: number
    rarityStats: Array<{ rarity: string; total: number; earned: number }>
    points: number
    level: number
  }> {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        throw new Error("Chưa đăng nhập")
      }

      const url = `${API_BASE}/badges/summary`
      console.log("Fetching badge summary from:", url)

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Badge summary response status:", res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Không thể tải thông tin huy hiệu: ${res.status} ${res.statusText}`)
      }

      const response: {
        statusCode: number
        success: boolean
        message: string
        data: {
          totalBadges: number
          earnedBadges: number
          notEarnedBadges: number
          completionRate: number
          rarityStats: Array<{ rarity: string; total: number; earned: number }>
          points: number
          level: number
        }
      } = await res.json()

      console.log("Badge summary response:", response)

      if (!response.success) {
        throw new Error(response.message || "Không thể tải thông tin huy hiệu")
      }

      return response.data
    } catch (error) {
      console.error("Error fetching badge summary:", error)
      throw error
    }
  },

  async getLeaderboard(
    period: "weekly" | "monthly" | "all-time" = "weekly",
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: LeaderboardEntry[]; hasMore: boolean }> {
    try {
      // Convert period format: "all-time" -> "all_time"
      const apiPeriod = period === "all-time" ? "all_time" : period

      const url = `${API_BASE}/leaderboards/users?period=${apiPeriod}&page=${page}&limit=${limit}`
      console.log("Fetching leaderboard from:", url)

      const token = tokenManager.getToken()
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch(url, {
        method: "GET",
        headers,
      })

      console.log("Response status:", res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Không thể tải bảng xếp hạng: ${res.status} ${res.statusText}`)
      }

      const response: {
        statusCode: number
        success: boolean
        message: string
        data: {
          type: "users"
          period: "weekly" | "monthly" | "all_time"
          page: number
          limit: number
          items: {
            userId: string
            score: number
            rank: number
            username: string
            avatar: string | null
            displayName: string
          }[]
        }
      } = await res.json()

      console.log("Leaderboard API response:", response)

      if (!response.success) {
        throw new Error(response.message || "Không thể tải bảng xếp hạng")
      }

      // Validate data structure
      if (!response.data || !Array.isArray(response.data.items)) {
        console.error("Invalid response structure:", response)
        throw new Error("Dữ liệu trả về không hợp lệ")
      }

      const items = response.data.items.map((item) => ({
        rank: item.rank,
        user: {
          id: item.userId,
          username: item.username,
          email: "",
          displayName: item.displayName,
          avatar: item.avatar,
          points: item.score,
          level: Math.floor(item.score / 100) + 1,
          badges: [],
          followers: 0,
          following: 0,
          joinedAt: new Date(),
        },
        points: item.score,
        change: 0, // Backend doesn't provide this yet
        period,
      }))

      // Check if there are more items (if we got less than limit, no more pages)
      const hasMore = response.data.items.length === limit

      console.log(`Loaded ${items.length} items, hasMore: ${hasMore}`)

      return { items, hasMore }
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      throw error
    }
  },

  async getGroupLeaderboard(
    period: "weekly" | "monthly" | "all-time" = "weekly",
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: any[]; hasMore: boolean }> {
    try {
      // Convert period format: "all-time" -> "all_time"
      const apiPeriod = period === "all-time" ? "all_time" : period

      const url = `${API_BASE}/leaderboards/groups?period=${apiPeriod}&page=${page}&limit=${limit}`
      console.log("Fetching group leaderboard from:", url)

      const token = tokenManager.getToken()
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const res = await fetch(url, {
        method: "GET",
        headers,
      })

      console.log("Response status:", res.status, res.statusText)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API Error Response:", errorText)
        throw new Error(`Không thể tải bảng xếp hạng nhóm: ${res.status} ${res.statusText}`)
      }

      const response: {
        statusCode: number
        success: boolean
        message: string
        data: {
          type: "groups"
          period: "weekly" | "monthly" | "all_time"
          page: number
          limit: number
          items: {
            groupId: string
            score: number
            rank: number
            name: string
            slug: string
            avatar: string | null
            coverImage: string | null
          }[]
        }
      } = await res.json()

      console.log("Group leaderboard API response:", response)

      if (!response.success) {
        throw new Error(response.message || "Không thể tải bảng xếp hạng nhóm")
      }

      // Validate data structure
      if (!response.data || !Array.isArray(response.data.items)) {
        console.error("Invalid response structure:", response)
        throw new Error("Dữ liệu trả về không hợp lệ")
      }

      const items = response.data.items.map((item) => ({
        rank: item.rank,
        group: {
          id: item.groupId,
          name: item.name,
          slug: item.slug,
          description: "",
          coverImage: item.coverImage,
          avatar: item.avatar,
          memberCount: 0,
          postCount: 0,
          tag: [],
          tags: [],
          createdAt: new Date(),
          isPrivate: false,
        },
        points: item.score,
        period,
      }))

      // Check if there are more items
      const hasMore = response.data.items.length === limit

      console.log(`Loaded ${items.length} group items, hasMore: ${hasMore}`)

      return { items, hasMore }
    } catch (error) {
      console.error("Error fetching group leaderboard:", error)
      throw error
    }
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Chưa đăng nhập")
    }

    const res = await fetch(`${API_BASE}/notifications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Không thể lấy danh sách thông báo")
    }

    const response = await res.json()
    // Backend trả về format: { statusCode, success, message, data }
    const notifications = response.data || response || []

    // Đảm bảo là array
    if (!Array.isArray(notifications)) {
      console.warn("Notifications response is not an array:", notifications)
      return []
    }

    return notifications.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      readAt: n.readAt ? new Date(n.readAt) : undefined,
    }))
  },

  async markNotificationRead(id: string): Promise<void> {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Chưa đăng nhập")
    }

    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Không thể đánh dấu thông báo đã đọc")
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Chưa đăng nhập")
    }

    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      throw new Error("Không thể đánh dấu tất cả thông báo đã đọc")
    }
  },

  // Search
  async search(query: string): Promise<SearchResult> {
    await delay(400)
    return {
      posts: mockPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) || p.content.toLowerCase().includes(query.toLowerCase())
      ),
      groups: mockGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(query.toLowerCase()) ||
          g.description.toLowerCase().includes(query.toLowerCase())
      ),
      users: mockUsers.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase())
      ),
    }
  },

  // Advanced search with filters using real API
  async advancedSearch(filters: {
    query: string
    type?: "all" | "posts" | "groups" | "users"
    sortBy?: "relevance" | "date" | "popularity" | "trending"
    dateRange?: {
      from?: Date
      to?: Date
    }
    tags?: string[]
    authors?: string[]
    groups?: string[]
    minLikes?: number
    hasAttachments?: boolean
    isFollowing?: boolean
    page?: number
    limit?: number
  }): Promise<{
    posts: Post[]
    groups: Group[]
    users: User[]
    total: number
    query: string
    took: number
    page: number
    pageSize: number
  }> {
    const token = tokenManager.getToken()

    try {
      // Try real API first
      const url = new URL(`${API_BASE}/search`)
      url.searchParams.set("q", filters.query)
      if (filters.type && filters.type !== "all") {
        url.searchParams.set("type", filters.type)
      }
      if (filters.sortBy) {
        url.searchParams.set("sort", filters.sortBy)
      }
      if (filters.page) {
        url.searchParams.set("page", String(filters.page))
      }
      if (filters.limit) {
        url.searchParams.set("limit", String(filters.limit))
      }
      if (filters.tags && filters.tags.length > 0) {
        url.searchParams.set("tags", filters.tags.join(","))
      }
      if (filters.dateRange?.from) {
        url.searchParams.set("from", filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        url.searchParams.set("to", filters.dateRange.to.toISOString())
      }
      if (filters.minLikes) {
        url.searchParams.set("minLikes", String(filters.minLikes))
      }
      if (filters.hasAttachments) {
        url.searchParams.set("hasAttachments", "true")
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        return {
          posts: data.data?.posts || [],
          groups: data.data?.groups || [],
          users: data.data?.users || [],
          total: data.data?.total || 0,
          query: filters.query,
          took: data.data?.took || 0,
          page: filters.page || 1,
          pageSize: filters.limit || 20,
        }
      }
    } catch (error) {
      console.warn("Real API search failed, falling back to mock:", error)
    }

    // Fallback to mock data
    await delay(600)
    let posts = [...mockPosts]
    let groups = [...mockGroups]
    let users = [...mockUsers]

    // Filter by query
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase()
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      )
      groups = groups.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query) ||
          g.tags?.some((tag) => {
            const tagStr = typeof tag === "string" ? tag : tag.name
            return tagStr.toLowerCase().includes(query)
          })
      )
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.bio && u.bio.toLowerCase().includes(query))
      )
    }

    // Filter by type
    if (filters.type === "posts") {
      groups = []
      users = []
    } else if (filters.type === "groups") {
      posts = []
      users = []
    } else if (filters.type === "users") {
      posts = []
      groups = []
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      posts = posts.filter((post) => filters.tags!.some((tag) => post.tags.includes(tag)))
      groups = groups.filter((group) =>
        filters.tags!.some((tag) => {
          if (!group.tags) return false
          if (typeof group.tags[0] === "string") {
            return (group.tags as string[]).includes(tag)
          } else {
            return (group.tags as Array<{ id: string; name: string }>).some((gt) => gt.name === tag)
          }
        })
      )
    }

    // Filter by date range
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const fromDate = filters.dateRange.from
      const toDate = filters.dateRange.to

      posts = posts.filter((post) => {
        const postDate = new Date(post.createdAt)
        if (fromDate && postDate < fromDate) return false
        if (toDate && postDate > toDate) return false
        return true
      })

      groups = groups.filter((group) => {
        const groupDate = new Date(group.createdAt)
        if (fromDate && groupDate < fromDate) return false
        if (toDate && groupDate > toDate) return false
        return true
      })
    }

    // Filter by attachments
    if (filters.hasAttachments) {
      posts = posts.filter((post) => post.attachments.length > 0)
    }

    // Filter by minimum likes
    if (filters.minLikes) {
      posts = posts.filter((post) => post.likeCount >= filters.minLikes!)
    }

    // Sort results
    if (filters.sortBy === "date") {
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (filters.sortBy === "popularity") {
      posts.sort((a, b) => b.likeCount - a.likeCount)
      groups.sort((a, b) => b.memberCount - a.memberCount)
      users.sort((a, b) => b.followers - a.followers)
    } else if (filters.sortBy === "trending") {
      // Simulate trending algorithm (recent + popular)
      posts.sort((a, b) => {
        const aScore =
          a.likeCount * 0.7 + ((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)) * 0.3
        const bScore =
          b.likeCount * 0.7 + ((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)) * 0.3
        return bScore - aScore
      })
    }

    const total = posts.length + groups.length + users.length
    const page = filters.page || 1
    const pageSize = filters.limit || 20

    return {
      posts,
      groups,
      users,
      total,
      query: filters.query,
      took: Math.random() * 200 + 100,
      page,
      pageSize,
    }
  },

  // Get search suggestions using real API
  async getSearchSuggestions(query: string): Promise<string[]> {
    const token = tokenManager.getToken()

    try {
      // Try real API first
      const response = await fetch(`${API_BASE}/search/suggestions?q=${encodeURIComponent(query)}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        return data.data || data.suggestions || []
      }
    } catch (error) {
      console.warn("Real API suggestions failed, falling back to mock:", error)
    }

    // Fallback to mock data
    await delay(200)

    const popularTags = ["javascript", "react", "typescript", "nextjs", "tailwind", "nodejs", "python", "design"]

    const allSuggestions = [
      ...popularTags,
      ...mockUsers.map((u) => u.displayName),
      ...mockUsers.map((u) => u.username),
      ...mockGroups.map((g) => g.name),
      ...mockPosts.map((p) => p.title.split(" ").slice(0, 2).join(" ")),
    ]

    return allSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
  },

  // Get trending searches using real API
  async getTrendingSearches(): Promise<string[]> {
    const token = tokenManager.getToken()

    try {
      // Try real API first
      const response = await fetch(`${API_BASE}/search/trending`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        return data.data || data.trending || []
      }
    } catch (error) {
      console.warn("Real API trending failed, falling back to mock:", error)
    }

    // Fallback to mock data
    await delay(300)
    return ["react hooks", "javascript tips", "css grid", "typescript", "nextjs", "tailwind css", "nodejs", "python"]
  },

  async getVideoCalls(filters?: { userId?: string; groupId?: string; status?: string; callType?: string }) {
    const token = tokenManager.getToken()
    const queryParams = new URLSearchParams()
    if (filters?.userId) queryParams.append("userId", filters.userId)
    if (filters?.groupId) queryParams.append("groupId", filters.groupId)
    if (filters?.status) queryParams.append("status", filters.status)
    if (filters?.callType) queryParams.append("callType", filters.callType)

    try {
      const response = await fetch(`${API_BASE}/video-calls?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        return data.data || []
      }
      return []
    } catch (error) {
      console.warn("Failed to fetch video calls:", error)
      return []
    }
  },

  async getVideoCall(callId: string) {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(`${API_BASE}/video-calls/${callId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  async getVideoCallByRoomId(roomId: string) {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(`${API_BASE}/video-calls/room/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  async startVideoCall(callId: string) {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(`${API_BASE}/video-calls/${callId}/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  async endVideoCall(callId: string) {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(`${API_BASE}/video-calls/${callId}/end`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  async leaveVideoCall(callId: string) {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(`${API_BASE}/video-calls/${callId}/leave`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  async getStunConfig() {
    const token = tokenManager.getToken()
    if (!token) {
      throw new Error("Token không tồn tại")
    }

    const response = await fetch(`${API_BASE}/video-calls/stun-config`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  // Video Calling
  async createVideoCall(data: {
    receiverId?: string
    groupId?: string
    participantIds?: string[]
    type: "video" | "audio"
  }) {
    const token = tokenManager.getToken()
    if (!token) throw new Error("Token không tồn tại")

    const payload: any = {
      participantIds: data.participantIds || (data.receiverId ? [data.receiverId] : []),
    }

    if (data.groupId) {
      payload.groupId = data.groupId
    }

    const response = await fetch(`${API_BASE}/video-calls`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  async getVideoCallToken(callId: string) {
    const token = tokenManager.getToken()
    if (!token) throw new Error("Token không tồn tại")

    const response = await fetch(`${API_BASE}/video-calls/${callId}/token`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.data || result
  },

  // Tags
  async getTrendingTags(limit: number = 15): Promise<
    {
      id: string
      name: string
      usageCount: number
      postCount: number
      groupCount: number
      score: number
    }[]
  > {
    const token = tokenManager.getToken()
    const url = new URL(`${API_BASE}/tags/trending`)
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.message || "Lấy danh sách thẻ thịnh hành thất bại")
    }

    return Array.isArray(data.data) ? data.data : []
  },

  async uploadFile(file: File, onProgress?: (progress: number) => void) {
    const token = tokenManager.getToken()
    if (!token) throw new Error("Token không tồn tại")

    return new Promise<any>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", file)

      xhr.open("POST", `${API_BASE}/files/upload`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            onProgress(percentComplete)
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            resolve(result.data || result)
          } catch (e) {
            reject(new Error("Phản hồi không hợp lệ"))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.message || `HTTP error! status: ${xhr.status}`))
          } catch (e) {
            reject(new Error(`HTTP error! status: ${xhr.status}`))
          }
        }
      }

      xhr.onerror = () => {
        reject(new Error("Lỗi mạng"))
      }

      xhr.send(formData)
    })
  },
}
