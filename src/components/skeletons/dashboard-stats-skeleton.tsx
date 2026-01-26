/**
 * DashboardStatsSkeleton Component
 * 
 * Skeleton loading state cho Dashboard Stats page
 * Hiển thị cấu trúc giống với dashboard-stats.client.tsx
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export function DashboardStatsSkeleton() {
  return (
    <Flex direction="col" flex="1" gap={6} padding="responsive-lg" position="relative" overflow="hidden" fullWidth>
      {/* Background gradient effects */}
      <Flex position="absolute-inset" className="-z-10" overflow="hidden">
        <Flex position="absolute-right-top" className="w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <Flex position="absolute" className="bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </Flex>

      <Flex direction="col" flex="1" gap={8} position="relative" className="z-10">
        {/* Header */}
        <Flex direction="col" gap={2} fullWidth>
          <Flex align="center" justify="between" gap={2} fullWidth>
            <Flex direction="col" gap={2} flex="1">
              <Flex align="center" gap={3}>
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-9 w-64" />
              </Flex>
              <Flex align="center" gap={2}>
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Charts Row */}
        <Grid cols="responsive-3" gap={6} fullWidth>
          {/* Line Chart Skeleton */}
          <Card className="relative overflow-hidden lg:col-span-2 xl:col-span-2">
            <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/5 to-background overflow-hidden" />
            <CardHeader className="relative z-10">
              <Flex direction="col" gap={2} fullWidth>
                <Flex align="center" justify="between" gap={4} fullWidth>
                  <Flex direction="col" gap={1}>
                    <Flex align="center" gap={2.5}>
                      <Skeleton className="h-5 w-5 rounded text-primary" />
                      <Skeleton className="h-6 w-40" />
                    </Flex>
                    <Skeleton className="h-4 w-64 opacity-70" />
                  </Flex>
                  <Skeleton className="h-9 w-36 rounded-md" />
                </Flex>
              </Flex>
            </CardHeader>
            <CardContent className="relative z-10">
              <Skeleton className="h-80 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Pie Chart Skeleton */}
          <Card className="relative overflow-hidden xl:col-span-1">
            <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/5 to-background overflow-hidden" />
            <CardHeader className="relative z-10">
              <Flex direction="col" gap={2} fullWidth>
                <Flex align="center" gap={2.5}>
                  <Skeleton className="h-5 w-5 rounded text-primary" />
                  <Skeleton className="h-6 w-40" />
                </Flex>
                <Skeleton className="h-4 w-64 opacity-70" />
              </Flex>
            </CardHeader>
            <CardContent className="relative z-10">
              <Flex direction="col" gap={6} fullWidth>
                <Flex align="center" justify="center" fullWidth>
                  <Skeleton className="h-80 w-80 rounded-full" />
                </Flex>
                <div className="border-t pt-4">
                  <Grid cols={1} gap={2} fullWidth>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Flex key={index} align="center" gap={3} fullWidth padding="xs" rounded="lg" border="all" className="border-transparent">
                        <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
                        <Flex direction="col" gap={1} flex="1" minWidth="0">
                          <Skeleton className="h-4 w-24" />
                        </Flex>
                        <Skeleton className="h-4 w-12" />
                      </Flex>
                    ))}
                  </Grid>
                </div>
              </Flex>
            </CardContent>
          </Card>
        </Grid>
      </Flex>
    </Flex>
  )
}
