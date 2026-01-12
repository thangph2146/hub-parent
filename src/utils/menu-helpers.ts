import * as React from "react"
import { Home, FileText } from "lucide-react"
import type { Permission } from "@/permissions"
import { getResourceSegmentForRoles } from "@/permissions"
import { buildNavigationMenu } from "./feature-helpers"
import type { MenuItem, MenuProject } from "@/types"

export const getMenuData = (
  userPermissions: Permission[],
  roles: Array<{ name: string }> = [],
  resourceSegmentOverride?: string,
): {
  navMain: MenuItem[]
  navSecondary: MenuItem[]
  projects: MenuProject[]
} => {
  const resourceSegment = resourceSegmentOverride ?? getResourceSegmentForRoles(roles)

  const navMain = buildNavigationMenu("main", userPermissions, resourceSegment)
  const navSecondary = buildNavigationMenu("secondary", userPermissions, resourceSegment)

  const projects: MenuProject[] = [
    {
      name: "Trang chính",
      url: "/",
      icon: React.createElement(Home, { className: "h-4 w-4" }),
    },
    {
      name: "Bài viết",
      url: "/bai-viet",
      icon: React.createElement(FileText, { className: "h-4 w-4" }),
    },
  ]

  return {
    navMain,
    navSecondary,
    projects,
  }
}
