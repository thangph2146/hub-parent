"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Flex } from "@/components/ui/flex"
import { TypographySpan } from "@/components/ui/typography"
import { IconSize } from "@/components/ui/typography"
import { useClientOnly } from "@/hooks/use-client-only"
import * as React from "react"

export interface NavMainItemProps {
  title: string
  url: string
  icon: React.ReactElement
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
  badgeCount?: number
}

export function NavMainItem({
  title,
  url,
  icon,
  isActive: propIsActive = false,
  items,
  badgeCount = 0,
}: NavMainItemProps) {
  // Chỉ render Collapsible sau khi component đã mount trên client để tránh hydration mismatch
  // Radix UI generate ID random khác nhau giữa server và client
  const isMounted = useClientOnly()
  const pathname = usePathname()

  // Tính toán isActive cho menu item chính - chỉ active khi pathname khớp chính xác với URL của nó
  const isActive = React.useMemo(() => {
    if (!pathname) return propIsActive

    // Normalize paths để so sánh
    const normalizedPathname = pathname.toLowerCase()
    const normalizedUrl = url.toLowerCase()

    // Chỉ active khi pathname khớp chính xác với URL của menu item
    // Không active khi chỉ có sub-item active
    return normalizedPathname === normalizedUrl
  }, [pathname, url, propIsActive])

  // Tính toán isActive cho từng sub menu item
  const getSubItemActive = React.useCallback((subItemUrl: string): boolean => {
    if (!pathname) return false
    const normalizedPathname = pathname.toLowerCase()
    const normalizedSubUrl = subItemUrl.toLowerCase()
    return normalizedPathname === normalizedSubUrl
  }, [pathname])

  // Clone icon element để đảm bảo tính hợp lệ khi truyền từ server component
  // Giữ nguyên tất cả props gốc để đảm bảo icon hoạt động đúng
  const iconElement = React.isValidElement(icon) 
    ? React.cloneElement(icon, { ...(icon.props as React.PropsWithChildren<React.SVGProps<SVGSVGElement>>) })
    : null

  if (!iconElement) return null

  const showBadge = badgeCount > 0 && isMounted // Chỉ hiển thị badge sau khi mount trên client

  // Nếu có sub items, menu item chính không dùng link
  const hasSubItems = items && items.length > 0
  const isParentActive = hasSubItems && items.some(subItem => getSubItemActive(subItem.url))

  // Render placeholder trên server để tránh hydration mismatch
  if (!isMounted) {
    return (
      <SidebarMenuItem>
        {hasSubItems ? (
          <SidebarMenuButton tooltip={title} isActive={isParentActive}>
            <Flex align="center" justify="between" fullWidth>
              <Flex align="center" gap={2} flex="1" minWidth="0">
                <IconSize size="sm">{iconElement}</IconSize>
                <TypographySpan>{title}</TypographySpan>
              </Flex>
              {/* Không render badge trên server để tránh hydration mismatch */}
            </Flex>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton asChild tooltip={title} isActive={isActive}>
            <Link href={url} className="w-full" suppressHydrationWarning>
              <Flex align="center" justify="between" fullWidth>
                <Flex align="center" gap={2} flex="1" minWidth="0">
                  <IconSize size="sm">{iconElement}</IconSize>
                  <TypographySpan>{title}</TypographySpan>
                </Flex>
                {/* Không render badge trên server để tránh hydration mismatch */}
              </Flex>
            </Link>
          </SidebarMenuButton>
        )}
        {items?.length && isParentActive ? (
          <SidebarMenuSub>
            {items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.url}>
                <SidebarMenuSubButton asChild isActive={getSubItemActive(subItem.url)}>
                  <Link href={subItem.url}>
                    <TypographySpan>{subItem.title}</TypographySpan>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        ) : null}
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible asChild defaultOpen={isParentActive || isActive}>
      <SidebarMenuItem>
        {hasSubItems ? (
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={title} isActive={isParentActive}>
              <Flex align="center" justify="between" fullWidth>
                <Flex align="center" gap={2} flex="1" minWidth="0">
                  <IconSize size="sm">{iconElement}</IconSize>
                  <TypographySpan>{title}</TypographySpan>
                </Flex>
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    shrink
                    suppressHydrationWarning
                    className="text-xs font-semibold min-w-[1.5rem] h-6 px-2 flex items-center justify-center"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </Flex>
            </SidebarMenuButton>
          </CollapsibleTrigger>
        ) : (
          <SidebarMenuButton asChild tooltip={title} isActive={isActive}>
            <Link href={url} className="w-full">
              <Flex align="center" justify="between" fullWidth>
                <Flex align="center" gap={2} flex="1" minWidth="0">
                  <IconSize size="sm">{iconElement}</IconSize>
                  <TypographySpan>{title}</TypographySpan>
                </Flex>
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    shrink
                    suppressHydrationWarning
                    className="text-xs font-semibold min-w-[1.5rem] h-6 px-2 flex items-center justify-center"
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </Badge>
                )}
              </Flex>
            </Link>
          </SidebarMenuButton>
        )}
        {items?.length ? (
          <>
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="data-[state=open]:rotate-90">
                <ChevronRight />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <SidebarMenuSub>
                {items.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.url}>
                    <SidebarMenuSubButton asChild isActive={getSubItemActive(subItem.url)}>
                      <Link href={subItem.url}>
                        <TypographySpan>{subItem.title}</TypographySpan>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </>
        ) : null}
      </SidebarMenuItem>
    </Collapsible>
  )
}

