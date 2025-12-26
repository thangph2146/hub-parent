/**
 * LoadingWrapper Component
 * 
 * Helper component để tạo loading page nhất quán cho admin pages
 * Giảm code lặp lại và đảm bảo structure nhất quán
 */

import { AdminHeader, type AdminBreadcrumbItem } from "@/components/layouts/headers"
import { Flex } from "@/components/ui/flex"

interface LoadingWrapperProps {
  breadcrumbs: AdminBreadcrumbItem[]
  children: React.ReactNode
  className?: string
}

export function LoadingWrapper({ breadcrumbs, children, className }: LoadingWrapperProps) {
  return (
    <>
      <AdminHeader breadcrumbs={breadcrumbs} />
      <Flex direction="col" gap={4} flex="1" padding="md" className={className}>
        {children}
      </Flex>
    </>
  )
}

