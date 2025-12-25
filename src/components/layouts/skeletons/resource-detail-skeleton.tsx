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
  fieldCount: _fieldCount,
  sectionCount = 1,
}: ResourceDetailSkeletonProps) {
  return (
    <Flex direction="col" flex="1" gap={6} padding="responsive-full">
      {showHeader && (
        <Flex align="center" fullWidth justify="between">
          <Flex direction="col" gap={2} flex="1" minWidth="0">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
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
              <Flex direction="col" gap={2}>
              <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </Flex>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <Grid cols={1} fullWidth gap={6}>
                <Flex paddingY={2} border="b-border-50" className="last:border-0">
                  <Flex direction="col" fullWidth gap={2}>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-full" />
                    </Flex>
                  </Flex>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Flex>
  )
}

