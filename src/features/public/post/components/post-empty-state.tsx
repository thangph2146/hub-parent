/**
 * Empty State Component for Post List
 * Server Component - không cần client-side logic
 */
import { FileText, Search } from "lucide-react"
import { iconSizes } from "@/lib/typography"
import { TypographyH3, TypographyPMuted, TypographySpanSmallMuted } from "@/components/ui/typography"
import { cn } from "@/lib/utils"

export const PostEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative bg-muted rounded-full p-6">
          <FileText className={cn(iconSizes["4xl"], "text-muted-foreground")} />
        </div>
      </div>
      <TypographyH3 className="mb-2">Không tìm thấy bài viết</TypographyH3>
      <TypographyPMuted className="max-w-md mb-4">
        Chưa có bài viết nào được xuất bản hoặc không có bài viết phù hợp với bộ lọc của bạn.
      </TypographyPMuted>
      <div className="flex items-center gap-2">
        <Search className={cn(iconSizes.sm)} />
        <TypographySpanSmallMuted>Thử thay đổi bộ lọc hoặc quay lại sau</TypographySpanSmallMuted>
      </div>
    </div>
  )
}

