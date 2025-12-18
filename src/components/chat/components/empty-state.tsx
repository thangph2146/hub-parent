import { MessageCircle } from "lucide-react"
import { typography } from "@/lib/typography"

interface EmptyStateProps {
  variant?: "messages" | "no-chat"
}

export function EmptyState({ variant = "messages" }: EmptyStateProps) {
  if (variant === "no-chat") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className={`${typography.body.medium} font-medium mb-1`}>Chọn một cuộc trò chuyện</p>
          <p className={typography.body.medium}>Bắt đầu trò chuyện từ danh sách bên trái</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className={typography.body.medium}>Chưa có tin nhắn nào</p>
      </div>
    </div>
  )
}

