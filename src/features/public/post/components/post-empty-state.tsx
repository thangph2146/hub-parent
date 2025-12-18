/**
 * Empty State Component for Post List
 * Server Component - không cần client-side logic
 */
import { FileText, Search } from "lucide-react"
import { typography, headerConfig } from "@/lib/typography"

export const PostEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative bg-muted rounded-full p-6">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h3 className={`${typography.heading.h3} mb-2`}>Không tìm thấy bài viết</h3>
      <p className={`${typography.body.muted.medium} max-w-md mb-4`}>
        Chưa có bài viết nào được xuất bản hoặc không có bài viết phù hợp với bộ lọc của bạn.
      </p>
      <div className={`flex items-center gap-2 ${typography.body.muted.medium}`}>
        <Search className="h-4 w-4" />
        <span>Thử thay đổi bộ lọc hoặc quay lại sau</span>
      </div>
    </div>
  )
}

