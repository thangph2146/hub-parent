import { Skeleton } from "@/components/ui/skeleton"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl pb-12">
      {/* Breadcrumb Skeleton */}
      <div className="pb-6">
        <Skeleton className="h-4 w-48 sm:w-64" />
      </div>

      <div className="relative">
        {/* Sticky Share Placeholder - Desktop only */}
        <div className="hidden xl:block absolute -left-16 top-0">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-full" />
            ))}
          </div>
        </div>

        <Flex direction="col" gap={8}>
          {/* Featured Image Skeleton */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-lg border border-border/50">
            <Skeleton className="h-full w-full" />
          </div>

          {/* Header Skeleton */}
          <Flex direction="col" gap={6}>
            {/* Title Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-10 w-[90%] sm:h-12 lg:h-14" />
              <Skeleton className="h-10 w-[60%] sm:h-12 lg:h-14" />
            </div>

            {/* Meta Info Skeleton */}
            <Flex align="center" gap={4} wrap className="sm:gap-6 pt-6 border-t">
              <Flex align="center" gap={2}>
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-24 sm:w-32" />
              </Flex>
              <Flex align="center" gap={2}>
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-20 sm:w-24" />
              </Flex>
              <Flex align="center" gap={2}>
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-16 sm:w-20" />
              </Flex>
              <Flex align="center" gap={2} className="hidden sm:flex">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </Flex>
            </Flex>
          </Flex>

          {/* Content Skeleton */}
          <div className="space-y-8 pt-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[95%]" />
              <Skeleton className="h-4 w-[98%]" />
              <Skeleton className="h-4 w-[92%]" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3 rounded-md" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[96%]" />
              </div>
            </div>

            <Skeleton className="h-[300px] sm:h-[450px] w-full rounded-2xl" />
            
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[98%]" />
              <Skeleton className="h-4 w-[95%]" />
            </div>
          </div>

          {/* Tags and Bottom Share Skeleton */}
          <div className="pt-10 border-t space-y-6">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
            <Flex align="center" justify="between" className="pt-4">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10 rounded-full" />
                ))}
              </div>
            </Flex>
          </div>

          {/* Related Posts Skeleton */}
          <section className="pt-16 border-t">
            <Flex align="center" gap={3} className="mb-10">
              <Skeleton className="h-12 w-12 rounded-xl bg-primary/5" />
              <Skeleton className="h-8 w-48 sm:h-10" />
            </Flex>

            <Grid cols="responsive-3" gap={8}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-5">
                  <Skeleton className="aspect-video w-full rounded-2xl" />
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-24 pt-2" />
                  </div>
                </div>
              ))}
            </Grid>
          </section>
        </Flex>
      </div>
    </div>
  )
}
