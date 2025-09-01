import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function ChatLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-80 border-r border-border">
        <LoadingSkeleton className="h-full" />
      </div>
      <div className="flex-1">
        <LoadingSkeleton className="h-full" />
      </div>
    </div>
  )
}
