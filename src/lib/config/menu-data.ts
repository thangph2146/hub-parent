/**
 * Menu data được build từ feature registry
 */
import * as React from "react"
import { Home, FileText, ShoppingBag, ShoppingCart, Package } from "lucide-react"

import type { Permission } from "@/lib/permissions"
import { buildNavigationMenu } from "./app-features"
import { getResourceSegmentForRoles } from "@/lib/permissions"
import type { MenuItem, MenuProject } from "./navigation-types"

export function getMenuData(
  userPermissions: Permission[],
  roles: Array<{ name: string }> = [],
  resourceSegmentOverride?: string,
): {
  navMain: MenuItem[]
  navSecondary: MenuItem[]
  projects: MenuProject[]
} {
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
    {
      name: "Sản phẩm",
      url: "/san-pham",
      icon: React.createElement(ShoppingBag, { className: "h-4 w-4" }),
    },
    {
      name: "Giỏ hàng",
      url: "/gio-hang",
      icon: React.createElement(ShoppingCart, { className: "h-4 w-4" }),
    },
    {
      name: "Đơn hàng",
      url: "/don-hang",
      icon: React.createElement(Package, { className: "h-4 w-4" }),
    },
  ]

  return {
    navMain,
    navSecondary,
    projects,
  }
}
