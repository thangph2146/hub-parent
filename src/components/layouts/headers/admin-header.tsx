/**
 * Admin Header Component - Header chung cho tất cả admin pages
 */
"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/layouts/notifications"
import { ModeToggle } from "@/components/layouts/shared"
import { Flex } from "@/components/ui/flex"
import { useResourceRouter, useResourceSegment } from "@/hooks/use-resource-segment"
import { applyResourceSegmentToPath } from "@/lib/permissions"
import { truncateBreadcrumbLabel } from "@/features/admin/resources/utils"
import { logger } from "@/lib/config/logger"

export interface AdminBreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface AdminHeaderProps {
  breadcrumbs?: AdminBreadcrumbItem[]
}

export function AdminHeader({ breadcrumbs = [] }: AdminHeaderProps) {
  const { data: session } = useSession()
  const router = useResourceRouter()
  const resourceSegment = useResourceSegment()
  const dashboardHref = applyResourceSegmentToPath("/admin/dashboard", resourceSegment)
  
  // Handle breadcrumb navigation với cache invalidation
  // Sử dụng cache-busting parameter để force Server Component refetch
  // Next.js sẽ tự động revalidate khi navigate, không cần gọi router.refresh()
  const handleBreadcrumbClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const startTime = performance.now()
    
    logger.info("🍞 Breadcrumb navigation", {
      source: "breadcrumb",
      href,
      resourceSegment,
      currentPath: window.location.pathname,
    })
    
    // Navigate với cache-busting parameter để force Server Component refetch
    const url = new URL(href, window.location.origin)
    url.searchParams.set("_t", Date.now().toString())
    const targetUrl = url.pathname + url.search
    
    logger.debug("➡️ Đang navigate từ breadcrumb", {
      originalHref: href,
      targetUrl,
    })
    
    // Chỉ gọi replace, Next.js sẽ tự động revalidate
    router.replace(targetUrl)
    
    const duration = performance.now() - startTime
    logger.success("✅ Breadcrumb navigation hoàn tất", {
      duration: `${duration.toFixed(2)}ms`,
      targetUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceSegment])

  return (
    <Flex
      as="header"
      data-admin-header="true"
      position="sticky"
      height="16"
      shrink
      align="center"
      gap={2}
      border="bottom"
      bg="background"
      className="top-0 z-50"
    >
      <Flex flex="1" align="center" gap={2} padding="md-x">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink 
                href={dashboardHref}
                onClick={(e) => handleBreadcrumbClick(e, dashboardHref)}
              >
                Trang quản trị
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.length > 0 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1
              const resolvedHref = item.href
                ? applyResourceSegmentToPath(item.href, resourceSegment)
                : undefined
              // Truncate label nếu quá dài để tránh breadcrumb quá dài
              const truncatedLabel = truncateBreadcrumbLabel(item.label)
              return (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                  <BreadcrumbItem className={item.isActive ? "" : "hidden md:block"}>
                    {isLast || !resolvedHref ? (
                      <BreadcrumbPage title={item.label}>{truncatedLabel}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        href={resolvedHref}
                        onClick={(e) => handleBreadcrumbClick(e, resolvedHref)}
                        title={item.label}
                      >
                        {truncatedLabel}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </Flex>
      {session?.user?.id && (
        <Flex align="center" gap={2} padding="md-x">
          <ModeToggle />
          <NotificationBell />
        </Flex>
      )}
    </Flex>
  )
}

