import { PostSkeleton } from "@/components/ui/loading-skeleton"
import { AppShell } from "@/components/layout/app-shell"

export default function BookmarksLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    </AppShell>
  )
}
