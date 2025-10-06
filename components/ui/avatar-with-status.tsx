import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarWithStatusProps {
  src?: string | null
  fallback: string
  alt?: string
  isOnline?: boolean
  showStatus?: boolean
  className?: string
  statusClassName?: string
}

export function AvatarWithStatus({
  src,
  fallback,
  alt,
  isOnline = false,
  showStatus = true,
  className,
  statusClassName,
}: AvatarWithStatusProps) {
  return (
    <div className="relative inline-block">
      <Avatar className={className}>
        <AvatarImage src={src || "/placeholder.svg"} alt={alt} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showStatus && isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background",
            statusClassName
          )}
          aria-label="Online"
        />
      )}
    </div>
  )
}
