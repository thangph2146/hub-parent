/**
 * DashboardStatsSkeleton Component
 * 
 * Skeleton loading state cho Dashboard Stats page
 * Hiển thị cấu trúc giống với dashboard-stats.client.tsx
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardStatsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </div>

      <div className="flex flex-1 flex-col gap-8 relative z-10">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-9 w-64" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </div>
        </div>
        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Line Chart Skeleton */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Pie Chart Skeleton */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-40" />
              </div>
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <Skeleton className="h-80 w-80 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

