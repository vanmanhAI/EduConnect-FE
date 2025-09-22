import { Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/layout/app-shell"
import { GroupSkeleton, Skeleton } from "@/components/ui/loading-skeleton"

export default function Loading() {
  const rightSidebarContent = (
    <div className="space-y-6">
      {/* Categories Skeleton */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-6" />
        </div>
      </div>
    </div>
  )

  return (
    <AppShell rightSidebarContent={rightSidebarContent}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Search and Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="Tìm kiếm nhóm theo tên, mô tả hoặc thẻ..." disabled className="pl-10 bg-muted" />
          </div>
          <Button variant="outline" disabled>
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
        </div>

        {/* Tabs Skeleton */}
        <Tabs value="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" disabled>
              Tất cả
            </TabsTrigger>
            <TabsTrigger value="joined" disabled>
              Đã tham gia
            </TabsTrigger>
            <TabsTrigger value="popular" disabled>
              Phổ biến
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {/* Groups Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <GroupSkeleton key={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
