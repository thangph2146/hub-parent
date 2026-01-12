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
    <Flex direction="col" flex="1" gap={6} padding="responsive-lg" position="relative" overflow="hidden">
      {/* Background gradient effects */}
      <Flex position="absolute-inset" className="-z-10" overflow="hidden">
        <Flex position="absolute-right-top" className="w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <Flex position="absolute" className="bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </Flex>

      <Flex direction="col" flex="1" gap={8} position="relative" className="z-10">
        {/* Welcome Header */}
        <Flex direction="col" gap={4} fullWidth>
          <Flex direction="col" gap={4} fullWidth>
            <Flex align="center" gap={3} wrap fullWidth>
              <Skeleton className="h-12 md:h-16 lg:h-20 w-64 md:w-80 lg:w-96" />
            </Flex>
            <Flex align="center" gap={2} fullWidth>
              <Skeleton className="h-5 w-5 rounded shrink" />
              <Skeleton className="h-5 w-48 flex-1" />
            </Flex>
            <Flex align="center" gap={3} wrap fullWidth>
              <Skeleton className="h-9 w-32 rounded-full shrink" />
              <Skeleton className="h-5 w-48 flex-1" />
            </Flex>
          </Flex>
        </Flex>

        {/* Permissions Card */}
        <Card className="relative overflow-hidden">
          <Flex position="absolute-inset" className="bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
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
            <Grid cols="responsive-3" gap={2} fullWidth>
              {Array.from({ length: 8 }).map((_, index) => (
                <Flex key={index} align="center" gap={2} fullWidth padding="xs" rounded="md" border="all">
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
