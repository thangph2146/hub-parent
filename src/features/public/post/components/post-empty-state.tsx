/**
 * Empty State Component for Post List
 * Server Component - không cần client-side logic
 */
import { FileText, Search } from "lucide-react"
import { TypographyH3, TypographyPMuted, TypographySpanSmallMuted, IconSize } from "@/components/ui/typography"
import { Flex } from "@/components/ui/flex"

export const PostEmptyState = () => {
  return (
    <Flex direction="col" align="center" justify="center" gap={6} className="py-20 text-center">
      <Flex className="relative">
        <Flex className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <Flex className="relative bg-muted rounded-full p-6">
          <IconSize size="4xl">
            <FileText />
          </IconSize>
        </Flex>
      </Flex>
      <Flex direction="col" align="center" gap={4} className="max-w-md">
        <TypographyH3>Không tìm thấy bài viết</TypographyH3>
        <TypographyPMuted>
          Chưa có bài viết nào được xuất bản hoặc không có bài viết phù hợp với bộ lọc của bạn.
        </TypographyPMuted>
      </Flex>
      <Flex align="center" gap={2}>
        <IconSize size="sm">
          <Search />
        </IconSize>
        <TypographySpanSmallMuted>Thử thay đổi bộ lọc hoặc quay lại sau</TypographySpanSmallMuted>
      </Flex>
    </Flex>
  )
}

