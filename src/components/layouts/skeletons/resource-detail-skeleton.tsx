/**
 * ResourceDetailSkeleton Component
 * 
 * Skeleton loading state cho ResourceDetailClient
 * Hiển thị cấu trúc detail page với skeleton fields
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export interface ResourceDetailSkeletonProps {
  showHeader?: boolean
  fieldCount?: number
  sectionCount?: number
}

export function ResourceDetailSkeleton({
  showHeader = true,
  fieldCount = 4,
  sectionCount = 1,
}: ResourceDetailSkeletonProps) {
  return (
    <Flex direction="col" flex="1" gap={6} padding="responsive-full" fullWidth>
      {showHeader && (
        <Flex align="center" justify="between" gap={2} fullWidth>
          <Flex direction="col" gap={2} flex="1" minWidth="0">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </Flex>
          <Flex align="center" gap={2} shrink>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </Flex>
        </Flex>
      )}

      <Grid cols={sectionCount === 1 ? "2-lg" : 1} fullWidth gap={6}>
        {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader className="pb-3">
              <Flex direction="col" gap={2} fullWidth>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </Flex>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <Flex direction="col" gap={4} fullWidth>
                {Array.from({ length: Math.max(2, fieldCount) }).map((_, fieldIndex) => (
                  <Flex key={fieldIndex} direction="col" gap={2} fullWidth paddingY={2.5} className={fieldIndex < Math.max(2, fieldCount) - 1 ? "border-b border-border/50" : ""}>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-full" />
                  </Flex>
                ))}
              </Flex>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Flex>
  )
}

