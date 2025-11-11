/**
 * Menu data được build từ feature registry
 */
import * as React from "react"
import { Home } from "lucide-react"

import type { Permission } from "@/lib/permissions"
import { buildNavigationMenu } from "./app-features"
import type { MenuItem, MenuProject } from "./navigation-types"

export function getMenuData(userPermissions: Permission[]): {
  navMain: MenuItem[]
  navSecondary: MenuItem[]
  projects: MenuProject[]
} {
  const navMain = buildNavigationMenu("main", userPermissions)
  const navSecondary = buildNavigationMenu("secondary", userPermissions)

  const projects: MenuProject[] = [
    {
      name: "Trang chính",
      url: "/",
      icon: React.createElement(Home, { className: "h-4 w-4" }),
    },
  ]

  return {
    navMain,
    navSecondary,
    projects,
  }
}
