import { PostListSkeleton } from "@/features/public/post/components/post-list"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container min-h-[calc(100vh-64px)] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 xl:py-12">
      {/* Breadcrumb Skeleton */}
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="flex flex-col gap-8">
        {/* Main Content Skeleton */}
        <div className="flex-1">
          <div className="sticky top-14 z-10 w-full mx-auto flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-0 -mx-4 sm:mx-0 py-3 sm:py-0 border-b bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border backdrop-blur-lg">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 sm:h-8" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 sm:h-10 sm:w-32" />
              <Skeleton className="h-9 w-24 sm:h-10 sm:w-32" />
              <Skeleton className="h-9 w-10 sm:h-10 sm:w-10" />
            </div>
          </div>

          <PostListSkeleton />
        </div>
      </div>
    </div>
  )
}
