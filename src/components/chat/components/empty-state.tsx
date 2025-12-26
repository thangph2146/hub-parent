import { MessageCircle } from "lucide-react"
import { TypographyP, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

interface EmptyStateProps {
  variant?: "messages" | "no-chat"
}

export function EmptyState({ variant = "messages" }: EmptyStateProps) {
  if (variant === "no-chat") {
    return (
      <Flex 
        direction="col" 
        align="center" 
        justify="center" 
        gap={4} 
        padding="md"
        fullWidth
        height="full"
      >
        <Flex direction="col" align="center" gap={1}>
          <IconSize size="4xl">
            <MessageCircle />
          </IconSize>
          <TypographyP>Chọn một cuộc trò chuyện</TypographyP>
          <TypographyP>Bắt đầu trò chuyện từ danh sách bên trái</TypographyP>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex 
      direction="col" 
      align="center" 
      justify="center" 
      gap={4} 
      padding="responsive-lg"
      fullWidth
      height="min-full"
    >
      <Flex direction="col" align="center" gap={1}>
        <IconSize size="3xl">
          <MessageCircle />
        </IconSize>
        <TypographyP>Chưa có tin nhắn nào</TypographyP>
      </Flex>
    </Flex>
  )
}

