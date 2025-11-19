/**
 * DashboardWelcomeSkeleton Component
 * 
 * Skeleton loading state cho Dashboard Welcome page
 * Hiển thị cấu trúc giống với dashboard-welcome.tsx
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardWelcomeSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00cc44]/5 dark:bg-[#00ff88]/5 rounded-full blur-3xl" />
      </div>

      <div className="flex flex-1 flex-col gap-8 relative z-10">
        {/* Welcome Header */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="h-12 md:h-16 lg:h-20 w-64 md:w-80 lg:w-96" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-9 w-32 rounded-full" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-md border">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

