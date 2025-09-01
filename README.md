# EduConnect - Nền tảng học tập xã hội

Nền tảng học tập xã hội kết nối cộng đồng, hỗ trợ chia sẻ kiến thức và phát triển kỹ năng.

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Animation**: Framer Motion (future)
- **State**: React hooks (local state)

### Backend (Planned)

- **Framework**: NestJS
- **Database**: MySQL
- **Real-time**: Socket.IO, WebRTC
- **Authentication**: JWT

## 📦 Installation

```bash
# Clone repository
git clone <repository-url>
cd EduConnect-FE

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run development server
npm run dev
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Check ESLint rules
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # TypeScript type checking

# Git Hooks (automatic)
npm run prepare      # Setup Husky hooks
```

## 🔧 Development Setup

### Git Hooks (Husky)

**Pre-commit** (auto-runs):

- ✅ Lint & auto-fix changed files
- ✅ Format JSON/MD files with Prettier
- ⚡ Fast (~3-5 seconds)

**Pre-push** (auto-runs):

- ✅ TypeScript type checking
- ✅ Production build test
- ⏱️ Slower (~30-60 seconds)

### Environment Variables

```bash
# .env.local (create from .env.example)
NEXT_PUBLIC_APP_NAME=EduConnect
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
NEXT_PUBLIC_ANALYTICS=false
NEXT_PUBLIC_AUTH_PROVIDER=mock
NEXT_PUBLIC_ENABLE_GAMIFICATION=true
NEXT_PUBLIC_ENABLE_VIDEO_PLACEHOLDER=true
```

## 📁 Project Structure

```
EduConnect-FE/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes group
│   ├── globals.css        # Global styles & CSS variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── ui/                # Reusable UI components (Radix)
│   ├── layout/            # Layout components (AppShell, Nav, Sidebar)
│   └── features/          # Feature-specific components
│       ├── posts/         # Post-related components
│       ├── groups/        # Group-related components
│       ├── users/         # User-related components
│       ├── search/        # Search components
│       └── video/         # Video call components
├── lib/
│   ├── api.ts            # Mock API functions
│   └── utils.ts          # Utility functions
├── types/
│   └── index.ts          # TypeScript type definitions
└── styles/
    └── globals.css       # Additional global styles
```

## 🎯 Core Features

### ✅ Implemented (UI)

- **Authentication**: Login/Register pages
- **Home**: Hero section, features, CTA
- **Feed**: Global posts feed with tabs
- **Groups**: Group exploration, detail pages with tabs
- **Posts**: Post cards, detail view, composer
- **People**: User directory with search/filter
- **Chat**: Real-time messaging UI (mock)
- **Video**: Video call interface (placeholder)
- **Gamification**: Badges, leaderboard, points
- **Notifications**: Notification center
- **Search**: Global search with command palette

### 🔄 Mock API Features

- User management (follow/unfollow)
- Group operations (join/leave)
- Post CRUD operations
- Comments system
- Chat messaging
- Notifications
- Gamification data

## 🎨 Design System

### Brand Colors

```css
--educonnect-primary: #4f46e5; /* Indigo */
--educonnect-accent: #06b6d4; /* Cyan */
--educonnect-success: #10b981; /* Green */
--educonnect-warning: #f59e0b; /* Amber */
--educonnect-danger: #f43f5e; /* Rose */
```

### Typography

- **Primary**: Inter (sans-serif)
- **Code**: JetBrains Mono (monospace)

### Dark Mode

- Supported via `next-themes`
- Toggle in user menu

## 🔗 Backend Integration Notes

### REST API Endpoints (Planned)

```
GET    /api/posts              # Get posts
POST   /api/posts              # Create post
GET    /api/posts/:id          # Get post detail
POST   /api/posts/:id/comments # Add comment

GET    /api/groups             # Get groups
POST   /api/groups             # Create group
GET    /api/groups/:id         # Get group detail
POST   /api/groups/:id/join    # Join group

GET    /api/users              # Get users
GET    /api/users/:id          # Get user profile
POST   /api/users/:id/follow   # Follow user

GET    /api/notifications      # Get notifications
PUT    /api/notifications/:id  # Mark as read

POST   /api/files/upload       # File upload
```

### Real-time (Socket.IO)

```
Rooms:
- chat:{roomId}          # Chat rooms
- notifications:{userId} # User notifications

Events:
- message:new           # New chat message
- typing               # Typing indicators
- presence             # Online/offline status
```

### WebRTC Video Calls

```
- WebSocket signaling server
- STUN/TURN servers (Coturn)
- Peer-to-peer video/audio
```

## 🚨 Known Issues & TODOs

### Fixed Issues ✅

- ~~CSS tokens not applying (::root → :root)~~
- ~~API method mismatches in PostDetail~~
- ~~Type inconsistencies in Chat/Video components~~
- ~~User field naming (name vs displayName)~~
- ~~Home page CTA wrong route~~
- ~~Mock posts not persisting after creation~~

### Remaining TODOs

- [ ] Add Prettier configuration
- [ ] Implement markdown/math rendering
- [ ] Add proper error boundaries
- [ ] Implement infinite scroll for feeds
- [ ] Add skeleton loading states
- [ ] Implement proper file upload UI
- [ ] Add unit tests
- [ ] Add Storybook for component documentation

## 🔍 Code Quality

### ESLint Rules

- Next.js recommended rules
- TypeScript strict mode
- React hooks rules
- Accessibility (a11y) rules

### Git Workflow

```bash
# Feature development
git checkout -b feature/your-feature
git add .
git commit -m "feat: add new feature"  # Triggers pre-commit hooks
git push origin feature/your-feature   # Triggers pre-push hooks

# Bypass hooks (emergency only)
git push --no-verify
```

## 🌐 Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push to main

### Manual Build

```bash
npm run build
npm run start
```

## 👥 Team Guidelines

### Commit Messages

```
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code refactoring
test: add tests
chore: maintenance
```

### Pull Request Process

1. Create feature branch
2. Make changes with proper commits
3. Ensure hooks pass locally
4. Create PR with description
5. Code review
6. Merge to main
