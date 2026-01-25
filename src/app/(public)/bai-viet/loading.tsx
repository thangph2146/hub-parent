import { PostListSkeleton } from "@/features/public/post/components/post-list"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container min-h-[calc(100vh-64px)] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
      {/* Breadcrumb Skeleton */}
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Skeleton */}
        <div className="flex-1 order-1 lg:order-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/50">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <PostListSkeleton />
        </div>

        {/* Sidebar Skeleton (Mobile/Desktop) */}
        <div className="hidden lg:block w-80 space-y-8 order-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
