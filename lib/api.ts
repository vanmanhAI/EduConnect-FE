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
    await delay(300)
    return mockUsers[0]
  },

  async getUser(id: string): Promise<User | null> {
    await delay(200)
    return mockUsers.find((u) => u.id === id) || null
  },

  async getUsers(): Promise<User[]> {
    await delay(400)
    return mockUsers
  },

  async followUser(userId: string): Promise<void> {
    await delay(300)
  },

  async unfollowUser(userId: string): Promise<void> {
    await delay(300)
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    await delay(500)
    return mockGroups
  },

  async createGroup(payload: { name: string; description?: string; privacy?: "public" | "private" }): Promise<Group> {
    const token = tokenManager.getToken()
    const res = await fetch(`${API_BASE}/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || "Tạo nhóm thất bại")
    }

    // Chuẩn hóa dữ liệu trả về
    const group: Group = (data?.data || data) as Group
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
            g.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
        )
      }
      if (filter === "public") items = items.filter((g) => !g.isPrivate)
      if (filter === "private") items = items.filter((g) => g.isPrivate)
      if (filter === "recent") items = items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      if (filter === "popular") items = items.sort((a, b) => b.memberCount - a.memberCount)
      const total = items.length
      const start = (page - 1) * limit
      const paged = items.slice(start, start + limit)
      return { items: paged, page, pageSize: limit, total }
    }
  },

  async getGroup(id: string): Promise<Group | null> {
    await delay(300)
    return mockGroups.find((g) => g.id === id) || null
  },

  async joinGroup(groupId: string): Promise<void> {
    await delay(400)
  },

  async leaveGroup(groupId: string): Promise<void> {
    await delay(400)
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
}
