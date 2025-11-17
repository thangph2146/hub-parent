import { AdminHeader } from "@/components/layouts/headers"
import { Skeleton } from "@/components/ui/skeleton"

export default function AccountsLoading() {
  return (
    <>
      <AdminHeader
        breadcrumbs={[
          { label: "Tài khoản", isActive: true },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </>
  )
}

