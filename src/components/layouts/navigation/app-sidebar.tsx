"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { appConfig, getAppBranding, getMenuData } from "@/lib/config"
import { NavProjects, NavSecondary, NavUser } from "."
import { AppSidebarSkeleton } from "@/components/layouts/skeletons"
import { Logo } from "../../../../public/svg/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuButtonContent,
  SidebarMenuButtonDescription,
  SidebarMenuButtonIcon,
  SidebarMenuButtonTitle,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TypographyPSmallMuted } from "@/components/ui/typography"
import type { Permission } from "@/lib/permissions"
import type { ReactNode } from "react"
import { useResourceSegment } from "@/hooks/use-resource-segment"
import { useUnreadCounts } from "@/hooks/use-unread-counts"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navMainSlot?: ReactNode
}

export function AppSidebar({ navMainSlot, ...props }: AppSidebarProps) {
  // Get session from NextAuth
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const resourceSegment = useResourceSegment()

  // Get unread counts - chỉ đọc từ cache, không polling
  // Polling được handle bởi nav-user và nav-main-with-badges
  const { data: unreadCounts } = useUnreadCounts({
    enabled: !!session?.user?.id,
    disablePolling: true, // Tắt polling hoàn toàn
  })

  // Get menu data based on permissions
  const menuData = React.useMemo(() => {
    const permissions = (session?.permissions || []) as Permission[]
    if (!permissions.length) {
      return {
        navMain: [],
        navSecondary: [],
        projects: [],
      }
    }
    const menu = getMenuData(permissions, session?.roles ?? [], resourceSegment)
    
    // Map unread counts to menu items
    const navMainWithBadges = menu.navMain.map((item) => {
      if (item.key === "messages") {
        return {
          ...item,
          badgeCount: unreadCounts?.unreadMessages || 0,
        }
      }
      if (item.key === "notifications") {
        return {
          ...item,
          badgeCount: unreadCounts?.unreadNotifications || 0,
        }
      }
      if (item.key === "contactRequests") {
        return {
          ...item,
          badgeCount: unreadCounts?.contactRequests || 0,
        }
      }
      return item
    })

    return {
      ...menu,
      navMain: navMainWithBadges,
    }
  }, [session?.permissions, session?.roles, resourceSegment, unreadCounts])

  const branding = React.useMemo(
    () =>
      getAppBranding({
        roles: session?.roles,
        resourceSegment,
      }),
    [session?.roles, resourceSegment],
  )

  const brandingName = branding.name ?? appConfig.name
  const brandingDescription = branding.description ?? appConfig.description
  const dashboardHref = `/${resourceSegment}/dashboard`

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton size="lg" asChild>
                  <a href={dashboardHref}>
                    <SidebarMenuButtonIcon>
                      <Logo />
                    </SidebarMenuButtonIcon>
                    <SidebarMenuButtonContent>
                      <SidebarMenuButtonTitle>{brandingName}</SidebarMenuButtonTitle>
                      <SidebarMenuButtonDescription>{brandingDescription}</SidebarMenuButtonDescription>
                    </SidebarMenuButtonContent>
                  </a>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <div className="space-y-1">
                  <p className="font-medium">{brandingName}</p>
                  <TypographyPSmallMuted className="opacity-90">{brandingDescription}</TypographyPSmallMuted>
                </div>
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoading ? (
          <AppSidebarSkeleton />
        ) : (
          <>
            {navMainSlot}
            <NavProjects projects={menuData.projects} />
            <NavSecondary items={menuData.navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
