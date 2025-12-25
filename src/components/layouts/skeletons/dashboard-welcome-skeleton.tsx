/**
 * DashboardWelcomeSkeleton Component
 * 
 * Skeleton loading state cho Dashboard Welcome page
 * Hiển thị cấu trúc giống với dashboard-welcome.tsx
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Grid } from "@/components/ui/grid"

export function DashboardWelcomeSkeleton() {
  return (
    <Flex direction="col" flex="1" gap={6} padding="responsive-lg" className="relative overflow-hidden">
      {/* Background gradient effects */}
      <Flex className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <Flex className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <Flex className="absolute bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </Flex>

      <Flex direction="col" flex="1" gap={8} className="relative z-10">
        {/* Welcome Header */}
        <Flex direction="col" gap={4}>
          <Flex direction="col" justify="between" gap={6} fullWidth>
            <Flex direction="col" gap={4}>
              <Flex align="center" gap={3} wrap>
                <Skeleton className="h-12 md:h-16 lg:h-20 w-64 md:w-80 lg:w-96" />
              </Flex>
              <Flex align="center" gap={2}>
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
              </Flex>
              <Flex align="center" gap={3} wrap>
                <Skeleton className="h-9 w-32 rounded-full" />
                <Skeleton className="h-5 w-48" />
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Permissions Card */}
        <Card className="relative overflow-hidden">
          <Flex className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
          <CardHeader className="relative z-10">
            <Flex direction="col" gap={2}>
              <Flex align="center" gap={2}>
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-48" />
              </Flex>
              <Skeleton className="h-4 w-96" />
            </Flex>
          </CardHeader>
          <CardContent className="relative z-10">
            <Grid cols="2-md" gap={2}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Flex key={index} align="center" gap={2} padding="xs" rounded="md" border="all">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </Flex>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Flex>
    </Flex>
  )
}
