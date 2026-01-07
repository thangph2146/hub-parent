"use client";

import * as React from "react";
import { useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { disconnectSocket } from "@/hooks/use-socket";
import { cleanupSessionCreatedFlag } from "@/hooks/use-create-login-session";
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  LayoutDashboard,
  Bell,
  FileText,
  FolderTree,
  GraduationCap,
  LifeBuoy,
  LogIn,
  MessageSquare,
  Send,
  Shield,
  Tag,
  Users,
  UserCircle,
  Upload,
  BadgeHelp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  posts: FileText,
  categories: FolderTree,
  tags: Tag,
  roles: Shield,
  students: GraduationCap,
  messages: Send,
  comments: MessageSquare,
  notifications: Bell,
  contactRequests: BadgeHelp,
  sessions: LogIn,
  uploads: Upload,
  accounts: UserCircle,
  support: LifeBuoy,
};

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuButtonContent,
  SidebarMenuButtonDescription,
  SidebarMenuButtonTitle,
  SidebarMenuItem,
  useSidebarOptional,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMenuData } from "@/lib/config/menu-data";
import type { Permission } from "@/lib/permissions";
import { canPerformAnyAction, getResourceSegmentForRoles } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { TypographySpanSmallMuted, TypographySpanMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { useClientOnly } from "@/hooks/use-client-only";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import { useNotificationsSocketBridge } from "@/hooks/use-notifications";
import { useContactRequestsSocketBridge } from "@/features/admin/contact-requests/hooks/use-contact-requests-socket-bridge";
import { useSocket } from "@/hooks/use-socket";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { logger } from "@/lib/config";
import { Grid } from "@/components/ui/grid";

// Helper functions
const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const formatBadgeCount = (count: number) => (count > 99 ? "99+" : count);

// Components
function UserAvatar({
  user,
  className,
  size = "h-8 w-8",
  rounded = false,
  suppressHydrationWarning,
}: {
  user: { image?: string | null; name?: string | null };
  className?: string;
  size?: string;
  rounded?: boolean;
  suppressHydrationWarning?: boolean;
}) {
  return (
    <Avatar className={cn(size, rounded && "rounded-lg", className)} suppressHydrationWarning={suppressHydrationWarning}>
      <AvatarImage src={user.image || "/avatars/default.jpg"} alt={user.name || ""} />
      <AvatarFallback className={rounded ? "rounded-lg" : ""}>
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function AdminMenuItem({
  item,
  isInSidebar,
}: {
  item: {
    url: string;
    title: string;
    icon: React.ReactNode;
    badgeCount?: number;
    isActive?: boolean;
  };
  isInSidebar: boolean;
}) {
  const showBadge = (item.badgeCount ?? 0) > 0;
  const isActive = item.isActive ?? false;
  const isValidIcon = React.isValidElement(item.icon);

  if (!isValidIcon) {
    logger.warn(`Icon is not a valid React element for "${item.title}"`);
  }

  return (
    <DropdownMenuItem key={item.url} asChild>
      <Link
        href={item.url}
        className={cn(
          "w-full data-[highlighted]:bg-accent/10",
          isActive && "bg-accent/20"
        )}
      >
        <Flex align="center" justify="between" className="w-full">
          <Flex align="center" gap={2}>
            {isValidIcon ? (
              item.icon
            ) : (
              <IconSize size="md" className={cn(!isInSidebar && "mr-2")}>
                <LayoutDashboard />
              </IconSize>
            )}
            <span>{item.title}</span>
          </Flex>
          {showBadge && (
            <Badge
              variant="destructive"
              className={cn(
                "ml-auto shrink-0",
                !isValidIcon && "text-xs font-semibold min-w-[1.5rem] h-6 px-2 flex items-center justify-center"
              )}
            >
              {formatBadgeCount(item.badgeCount ?? 0)}
            </Badge>
          )}
        </Flex>
      </Link>
    </DropdownMenuItem>
  );
}

export function NavUser({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const userId = session?.user?.id;
  const primaryRoleName = session?.roles?.[0]?.name ?? null;
  const queryClient = useQueryClient();
  const isMounted = useClientOnly();
  const sidebar = useSidebarOptional();
  const isInSidebar = sidebar !== null;
  const isMobile = sidebar?.isMobile ?? false;
  const user = session?.user;
  const primaryRole = session?.roles?.[0];

  // Setup socket bridges
  useNotificationsSocketBridge();
  useContactRequestsSocketBridge();

  const { socket } = useSocket({ userId, role: primaryRoleName });
  const [isSocketConnected, setIsSocketConnected] = React.useState(false);

  // Socket connection management
  React.useEffect(() => {
    if (!socket) {
      setIsSocketConnected(false);
      return;
    }

    setIsSocketConnected(socket.connected);

    const handleConnect = () => {
      setIsSocketConnected(true);
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.unreadCounts.user(userId),
        });
      }
    };

    const handleDisconnect = (reason: string) => {
      setIsSocketConnected(false);
      if (reason !== "io client disconnect" && reason !== "io server disconnect") {
        logger.debug("NavUser: Socket disconnected", { reason, userId });
      }
    };

    const invalidateUnreadCounts = () => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.unreadCounts.user(userId),
        });
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnect", handleConnect);
    socket.on("message:new", invalidateUnreadCounts);
    socket.on("message:updated", invalidateUnreadCounts);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnect", handleConnect);
      socket.off("message:new", invalidateUnreadCounts);
      socket.off("message:updated", invalidateUnreadCounts);
    };
  }, [socket, userId, queryClient]);

  const { data: unreadCounts } = useUnreadCounts({
    refetchInterval: 60000,
    enabled: !!userId,
    disablePolling: isSocketConnected,
  });

  const unreadMessagesCount = unreadCounts?.unreadMessages || 0;
  const unreadNotificationsCount = unreadCounts?.unreadNotifications || 0;
  const contactRequestsCount = unreadCounts?.contactRequests || 0;

  const isItemActive = useCallback(
    (item: { url: string; items?: Array<{ url: string }> }): boolean => {
      if (!pathname) return false;
      const normalizedPathname = pathname.toLowerCase();
      const normalizedItemUrl = item.url.toLowerCase();

      if (normalizedPathname === normalizedItemUrl) return true;

      if (item.items?.length) {
        const hasActiveSubItem = item.items.some((subItem) => {
          const normalizedSubUrl = subItem.url.toLowerCase();
          return (
            normalizedPathname === normalizedSubUrl ||
            normalizedPathname.startsWith(normalizedSubUrl + "/")
          );
        });
        if (hasActiveSubItem) return true;
      }

      if (normalizedPathname.startsWith(normalizedItemUrl + "/")) {
        return !item.items?.length;
      }

      return false;
    },
    [pathname]
  );

  const adminMenuItems = useMemo(() => {
    const permissions = (session?.permissions || []) as Permission[];
    const roles = (session?.roles || []) as Array<{ name: string }>;
    if (!permissions.length) return [];

    const resourceSegment = getResourceSegmentForRoles(roles);
    const menuItems = getMenuData(permissions, roles, resourceSegment).navMain.filter((item) =>
      canPerformAnyAction(permissions, roles, [...item.permissions])
    );

    const badgeMap: Record<string, number> = {
      messages: unreadMessagesCount,
      notifications: unreadNotificationsCount,
      contactRequests: contactRequestsCount,
    };

    return menuItems.map((item) => {
      const iconKey = item.key || "";
      const IconComponent = iconMap[iconKey];
      const icon = IconComponent ? (
        <IconSize size="sm">
          <IconComponent />
        </IconSize>
      ) : item.icon;

      return {
        ...item,
        icon,
        isActive: isItemActive(item),
        badgeCount: badgeMap[iconKey],
      };
    });
  }, [session, unreadMessagesCount, unreadNotificationsCount, contactRequestsCount, isItemActive]);

  const accountsRoute = useMemo(() => {
    const roles = (session?.roles || []) as Array<{ name: string }>;
    const resourceSegment = getResourceSegmentForRoles(roles);
    return `/${resourceSegment}/accounts`;
  }, [session?.roles]);

  const handleSignOut = () => {
    if (session?.user?.id) {
      cleanupSessionCreatedFlag(session.user.id);
    }
    disconnectSocket();
    signOut({ callbackUrl: "/auth/sign-in" });
  };

  // Loading state
  if (status === "loading" || !user) {
    if (!isInSidebar) {
      return (
        <Flex align="center" gap={2}>
          <Avatar className="h-8 w-8">
            <AvatarFallback>...</AvatarFallback>
          </Avatar>
        </Flex>
      );
    }
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <UserAvatar user={{}} rounded />
            <Flex direction="col" flex="1" textAlign="left" suppressHydrationWarning>
              <TypographySpanMuted className="truncate">Đang tải...</TypographySpanMuted>
              <TypographySpanSmallMuted className="truncate">Vui lòng chờ</TypographySpanSmallMuted>
            </Flex>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const dropdownMenuContent = (
    <DropdownMenuContent
      className="w-[300px] rounded-lg"
      side={!isInSidebar ? "bottom" : isMobile ? "bottom" : "right"}
      align="end"
      sideOffset={5}
    >
      <DropdownMenuLabel className="p-0">
        <Flex align="center" gap={2} className="px-1 py-1.5 text-left min-w-0">
          <UserAvatar user={user} rounded size="h-8 w-8" className="shrink-0" />
          <Flex direction="col" flex="1" minWidth="0" textAlign="left">
            <TypographySpanMuted className="truncate">{user.name || user.email}</TypographySpanMuted>
            <TypographySpanSmallMuted className="truncate">{user.email}</TypographySpanSmallMuted>
          </Flex>
        </Flex>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem asChild>
          <Link href={accountsRoute} className="w-full data-[highlighted]:bg-accent/20">
            <Flex align="center" gap={2}>
              <IconSize size="md" className={cn(!isInSidebar && "mr-2")}>
                <BadgeCheck />
              </IconSize>
              <span>Tài khoản</span>
            </Flex>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      {adminMenuItems.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <ScrollArea className="max-h-[200px] overflow-y-auto">
              {adminMenuItems.map((item) => (
                <AdminMenuItem key={item.url} item={item} isInSidebar={isInSidebar} />
              ))}
            </ScrollArea>
          </DropdownMenuGroup>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={handleSignOut}
        className="w-full text-destructive focus:text-destructive data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10 disabled:opacity-50"
      >
        <IconSize size="md" className={cn("text-destructive", !isInSidebar && "mr-2")}>
          <LogOut />
        </IconSize>
        <span>Đăng xuất</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  // Server-side placeholder
  if (!isMounted) {
    if (!isInSidebar) {
      return (
        <Flex align="center" gap={2} suppressHydrationWarning>
          <UserAvatar user={user} suppressHydrationWarning />
          <TypographySpanMuted className="inline-block truncate max-w-[120px]" suppressHydrationWarning>
            {user.name || user.email}
          </TypographySpanMuted>
        </Flex>
      );
    }
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <UserAvatar user={user} rounded suppressHydrationWarning />
            <Grid cols={1} align="start" justify="start" suppressHydrationWarning>
              <TypographySpanMuted className="truncate" suppressHydrationWarning>
                {user.name || user.email}
              </TypographySpanMuted>
              <TypographySpanSmallMuted className="truncate" suppressHydrationWarning>
                {primaryRole?.displayName || primaryRole?.name || user.email}
              </TypographySpanSmallMuted>
            </Grid>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Header style (not in sidebar)
  if (!isInSidebar) {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn("px-2 group border border-border", className)}
            suppressHydrationWarning
          >
            <Flex align="center" gap={2}>
              <UserAvatar user={user} suppressHydrationWarning />
              <TypographySpanMuted className="inline-block truncate max-w-[120px]" suppressHydrationWarning>
                {user.name || user.email}
              </TypographySpanMuted>
              <IconSize
                size="md"
                className="opacity-50 group-hover:text-primary-foreground group-hover:opacity-100 transition-colors duration-200"
              >
                <ChevronsUpDown />
              </IconSize>
            </Flex>
          </Button>
        </DropdownMenuTrigger>
        {dropdownMenuContent}
      </DropdownMenu>
    );
  }

  // Sidebar style
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar user={user} rounded />
              <SidebarMenuButtonContent>
                <SidebarMenuButtonTitle>{user.name || user.email}</SidebarMenuButtonTitle>
                <SidebarMenuButtonDescription>
                  {primaryRole?.displayName || primaryRole?.name || user.email}
                </SidebarMenuButtonDescription>
              </SidebarMenuButtonContent>
              <IconSize size="sm" className="ml-auto opacity-50">
                <ChevronsUpDown />
              </IconSize>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {dropdownMenuContent}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}