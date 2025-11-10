import { MessageCircle } from "lucide-react"

interface EmptyStateProps {
  variant?: "messages" | "no-chat"
}

export function EmptyState({ variant = "messages" }: EmptyStateProps) {
  if (variant === "no-chat") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-base font-medium mb-1">Chọn một cuộc trò chuyện</p>
          <p className="text-sm">Bắt đầu trò chuyện từ danh sách bên trái</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full items-center justify-center">
      <div className="text-center text-muted-foreground">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">Chưa có tin nhắn nào</p>
      </div>
    </div>
  )
}

