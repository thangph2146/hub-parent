"use client"

import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useClientOnly } from "@/hooks/use-client-only"
import { typography } from "@/lib/typography"
import * as React from "react"


export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: React.ReactElement
  }[]
}) {
  const { isMobile } = useSidebar()
  // Chỉ render sau khi component đã mount trên client để tránh hydration mismatch
  // Radix UI generate ID random khác nhau giữa server và client
  const isMounted = useClientOnly()

  // Render placeholder trên server để tránh hydration mismatch
  if (!isMounted) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarMenu>
          {projects.map((item) => {
            // Clone icon element để đảm bảo tính hợp lệ khi truyền từ server component
            // Giữ nguyên tất cả props gốc để đảm bảo icon hoạt động đúng
            const iconElement = React.isValidElement(item.icon)
              ? React.cloneElement(item.icon, { ...(item.icon.props as React.PropsWithChildren<React.SVGProps<SVGSVGElement>>) })
              : null

            if (!iconElement) {
              return null
            }
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    {iconElement}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          // Clone icon element để đảm bảo tính hợp lệ khi truyền từ server component
          const iconElement = React.isValidElement(item.icon)
            ? React.cloneElement(item.icon, { key: `icon-${item.name}` })
            : null

          if (!iconElement) {
            console.warn(`Icon is not a valid React element for project "${item.name}"`)
            return null
          }
          
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  {iconElement}
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem>
                    <Folder className="text-muted-foreground" />
                    <span className={typography.body.medium}>View Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share className="text-muted-foreground" />
                    <span className={typography.body.medium}>Share Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Trash2 className="text-muted-foreground" />
                    <span className={typography.body.medium}>Delete Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
