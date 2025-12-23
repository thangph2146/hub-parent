import { MessageCircle } from "lucide-react"
import { TypographyP, IconSize } from "@/components/ui/typography"

interface EmptyStateProps {
  variant?: "messages" | "no-chat"
}

export function EmptyState({ variant = "messages" }: EmptyStateProps) {
  if (variant === "no-chat") {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <IconSize size="4xl" className="mx-auto mb-4 opacity-30">
            <MessageCircle />
          </IconSize>
          <TypographyP className="mb-1">Chọn một cuộc trò chuyện</TypographyP>
          <TypographyP>Bắt đầu trò chuyện từ danh sách bên trái</TypographyP>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full items-center justify-center">
      <div className="text-center text-muted-foreground">
        <IconSize size="3xl" className="mx-auto mb-4 opacity-50">
          <MessageCircle />
        </IconSize>
        <TypographyP>Chưa có tin nhắn nào</TypographyP>
      </div>
    </div>
  )
}

