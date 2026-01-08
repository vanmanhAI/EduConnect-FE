"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface LoginPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function LoginPromptDialog({
  open,
  onOpenChange,
  title = "Yêu cầu đăng nhập",
  description = "Bạn cần đăng nhập để thực hiện chức năng này. Vui lòng đăng nhập hoặc đăng ký tài khoản mới.",
}: LoginPromptDialogProps) {
  const router = useRouter()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => router.push("/login")}
            className="bg-educonnect-primary hover:bg-educonnect-primary/90"
          >
            Đăng nhập
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => router.push("/register")}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Đăng ký
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
