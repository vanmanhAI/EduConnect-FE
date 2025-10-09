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
    await delay(400)
    return mockUsers
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
  }): Promise<Group> {
    const token = tokenManager.getToken()

    // Transform payload to match backend API
    const requestBody: CreateGroupRequest = {
      name: payload.name,
      description: payload.description || "",
      tags: payload.tags || [],
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
  async searchGroupsByKeyword(keyword: string): Promise<{ total: number; groups: Group[] }> {
    const token = tokenManager.getToken()
    const url = new URL(`${API_BASE}/groups/search`)
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
    if (!data.data || !data.data.groups || !Array.isArray(data.data.groups)) {
      console.warn("Invalid groups data structure:", data)
      return {
        total: 0,
        groups: [],
      }
    }

    // Transform API data to match frontend interface
    const groups = data.data.groups.map((group: any) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      tags: group.tag || [], // Map 'tag' field to 'tags' for backward compatibility
      isPrivate: false, // Default value as API doesn't provide this field
      ownerId: "", // Default value as API doesn't provide this field
      members: [], // Default value as API doesn't provide this field
      postCount: group.postCount || 0, // Ensure postCount is available
    }))

    return {
      total: data.data.total || 0,
      groups,
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
        joinStatus: "not-joined",
      }

      return group
    } catch (error) {
      console.error("Error fetching group:", error)
      return null
    }
  },

  async updateGroup(
    groupId: string,
    data: { name: string; description: string; tags: string[] }
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

  // Posts
  async getPosts(groupId?: string): Promise<Post[]> {
    await delay(600)
    return groupId ? mockPosts.filter((p) => p.groupId === groupId) : mockPosts
  },

  async getPost(id: string): Promise<Post | null> {
    await delay(300)
    return mockPosts.find((p) => p.id === id) || null
  },

  async createPost(data: Partial<Post>): Promise<Post> {
    await delay(500)
    const newPost: Post = {
      id: Date.now().toString(),
      title: data.title || "",
      content: data.content || "",
      authorId: "1",
      author: mockUsers[0],
      groupId: data.groupId,
      group: data.groupId ? mockGroups.find((g) => g.id === data.groupId) : undefined,
      tags: data.tags || [],
      attachments: [],
      reactions: [],
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLiked: false,
      likeCount: 0,
    }
    return newPost
  },

  async likePost(postId: string): Promise<void> {
    await delay(200)
  },

  async unlikePost(postId: string): Promise<void> {
    await delay(200)
  },

  // Comments
  async getComments(postId: string): Promise<Comment[]> {
    await delay(400)
    return []
  },

  async createComment(postId: string, content: string): Promise<Comment> {
    await delay(300)
    return {
      id: Date.now().toString(),
      content,
      authorId: "1",
      author: mockUsers[0],
      postId,
      reactions: [],
      createdAt: new Date(),
      isLiked: false,
      likeCount: 0,
      likes: 0,
    }
  },

  // Chat
  async getChatThreads(): Promise<ChatThread[]> {
    await delay(400)
    return mockChatThreads
  },

  async getChatMessages(threadId: string): Promise<ChatMessage[]> {
    await delay(300)
    return mockChatMessages[threadId] || []
  },

  async sendMessage(message: Omit<ChatMessage, "id">): Promise<ChatMessage> {
    await delay(200)
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
    }

    // Add to mock data
    if (!mockChatMessages[message.threadId]) {
      mockChatMessages[message.threadId] = []
    }
    mockChatMessages[message.threadId].push(newMessage)

    return newMessage
  },

  async getConversations(): Promise<Conversation[]> {
    await delay(400)
    return []
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await delay(300)
    return []
  },

  async sendChatMessage(conversationId: string, content: string): Promise<ChatMessage> {
    await delay(200)
    return {
      id: Date.now().toString(),
      threadId: conversationId,
      content,
      senderId: "1",
      sender: mockUsers[0],
      conversationId,
      type: "text",
      timestamp: new Date(),
      createdAt: new Date(),
      isRead: false,
    }
  },

  // Gamification
  async getBadges(): Promise<Badge[]> {
    await delay(300)
    return mockBadges
  },

  async getLeaderboard(period: "weekly" | "monthly" | "all-time" = "weekly"): Promise<LeaderboardEntry[]> {
    await delay(500)
    return mockUsers.map((user, index) => ({
      rank: index + 1,
      user,
      points: user.points,
      change: Math.floor(Math.random() * 20) - 10,
      period,
    }))
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    await delay(300)
    return [
      {
        id: "1",
        type: "like",
        title: "Bài viết được thích",
        message: "Trần Thị B đã thích bài viết của bạn",
        isRead: false,
        createdAt: new Date(),
        actionUrl: "/posts/1",
        actorId: "2",
        actor: mockUsers[1],
      },
    ]
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(200)
  },

  async markAllNotificationsRead(): Promise<void> {
    await delay(300)
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
}
