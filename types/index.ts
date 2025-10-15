export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string | null
  bio?: string
  location?: string
  website?: string
  linkedin?: string
  github?: string
  points: number
  level: number
  experiencePoints?: number
  followersCount?: number
  followingCount?: number
  postsCount?: number
  groupsCount?: number
  experienceLevel?: string
  profileVisibility?: string
  badges: Badge[]
  followers: number
  following: number
  joinedAt: Date
  isFollowing?: boolean
  isOnline?: boolean
}

export interface Group {
  id: string
  name: string
  slug?: string
  description: string
  coverImage?: string | null
  avatar?: string | null
  memberCount: number
  postCount: number
  tag: string[]
  createdAt: string | Date
  isPrivate?: boolean
  ownerId?: string
  members?: GroupMember[]
  userRole?: "owner" | "mod" | "member" | null
  joinStatus?: "joined" | "pending" | "not-joined"
  // Legacy compatibility - can be array of strings or array of tag objects
  tags?: string[] | Array<{ id: string; name: string }>
}

// API Response interfaces
export interface GroupsApiResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    total: number
    groups: Group[]
  }
}

export interface CreateGroupRequest {
  name: string
  description: string
  tags: string[]
}

export interface CreateGroupApiResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    id: string
    name: string
    slug: string
    description: string
    ownerId: string
    coverImage?: string | null
    avatar?: string | null
    memberCount: number
    postCount: number
    createdAt: string
    tags: Array<{
      id: string
      name: string
    }>
  }
}

export interface GroupMember {
  userId: string
  user: User
  role: "owner" | "mod" | "member"
  joinedAt: Date
}

export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  author: User
  groupId?: string
  group?: Group
  tags: string[]
  attachments: FileAsset[]
  reactions: Reaction[]
  commentCount: number
  createdAt: Date
  updatedAt: Date
  isLiked?: boolean
  likeCount: number
}

export interface Comment {
  id: string
  content: string
  authorId: string
  author: User
  postId: string
  parentId?: string
  replyToCommentId?: string | null
  replyToUser?: {
    id: string
    username: string
    displayName: string
    avatar: string | null
  } | null
  replies?: Comment[]
  reactions: Reaction[]
  createdAt: Date
  updatedAt?: Date
  isLiked?: boolean
  likeCount: number
  likes: number
}

export interface Reaction {
  id: string
  type: "like" | "upvote" | "heart"
  userId: string
  user: User
  targetId: string
  targetType: "post" | "comment"
  createdAt: Date
}

export interface ChatMessage {
  id: string
  threadId: string
  content: string
  senderId: string
  sender: User
  conversationId: string
  type: "text" | "file" | "system"
  attachments?: FileAsset[]
  timestamp: Date
  createdAt: Date
  isRead: boolean
}

export interface ChatThreadParticipant {
  id: string
  name: string
  displayName: string
  avatar?: string
  isOnline?: boolean
}

export interface ChatThread {
  id: string
  participants: ChatThreadParticipant[]
  lastMessage: {
    id: string
    content: string
    timestamp: Date
    senderId: string
  }
  unreadCount: number
  type: "direct" | "group"
}

export interface Conversation {
  id: string
  type: "direct" | "group"
  participants: User[]
  lastMessage?: ChatMessage
  unreadCount: number
  updatedAt: Date
  groupId?: string
  group?: Group
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  criteria: string
  rarity: "common" | "rare" | "epic" | "legendary"
  earnedAt?: Date
  progress?: number
}

export interface LeaderboardEntry {
  rank: number
  user: User
  points: number
  change: number
  period: "weekly" | "monthly" | "all-time"
}

export interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "group_invite" | "badge" | "mention"
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  actorId?: string
  actor?: User
}

export interface FileAsset {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: Date
}

export interface SearchResult {
  posts: Post[]
  groups: Group[]
  users: User[]
}

// API Response types for authentication
export interface ApiResponse<T = any> {
  statusCode: number
  success: boolean
  message: string
  data?: T
}

export interface AuthData {
  accessToken: string
  user: {
    id: string
    username: string
    displayName: string
    avatar: string | null
    points: number
    level: number
    experienceLevel: string
    isOnline: boolean
  }
}

export interface LoginResponse extends ApiResponse<AuthData> {}
export interface RegisterResponse extends ApiResponse<AuthData> {}

export interface FollowerApiData {
  id: string
  username: string
  displayname: string
  avatar: string | null
  bio: string | null
  points: number
  level: number
  followerscount: number
  followingcount: number
  isonline: boolean
  profilevisibility: string
}

export interface FollowersResponse extends ApiResponse<FollowerApiData[]> {}
export interface FollowingResponse extends ApiResponse<FollowerApiData[]> {}

export interface UserProfileApiData {
  id: string
  username: string
  email: string
  displayName: string
  avatar: string | null
  bio: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
  points: number
  level: number
  experiencePoints: number
  followersCount: number
  followingCount: number
  postsCount: number
  groupsCount: number
  experienceLevel: string
  isOnline: boolean
  profileVisibility: string
  isFollowing: boolean
  createdAt: string
}

export interface UserProfileResponse extends ApiResponse<UserProfileApiData> {}

export interface FollowResponse extends ApiResponse<null> {}
export interface UnfollowResponse extends ApiResponse<null> {}
