/**
 * ResourceDetailSkeleton Component
 * 
 * Skeleton loading state cho ResourceDetailClient
 * Hiển thị cấu trúc detail page với skeleton fields
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"
import { FieldSet, FieldLegend } from "@/components/ui/field"
import { cn } from "@/lib/utils"

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

      <Flex direction="col" gap={6} fullWidth>
        {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
          <FieldSet 
            key={sectionIndex}
            className={cn(
              "group/field-set",
              "transition-all duration-300"
            )}
          >
            <FieldLegend variant="legend">
              <Skeleton className="h-5 w-48 inline-block" />
            </FieldLegend>
            <div className="mx-0 mb-3 px-2 border-b-0 w-auto text-xs sm:text-sm md:text-base font-normal text-muted-foreground">
              <Skeleton className="h-4 w-64 inline-block" />
            </div>
            <Grid cols={fieldCount > 2 ? "2-lg" : 1} fullWidth gap={6}>
              {Array.from({ length: Math.max(2, fieldCount) }).map((_, fieldIndex) => (
                <Flex key={fieldIndex} direction="col" gap={2} fullWidth paddingY={2.5}>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-full" />
                </Flex>
              ))}
            </Grid>
          </FieldSet>
        ))}
      </Flex>
    </Flex>
  )
}

