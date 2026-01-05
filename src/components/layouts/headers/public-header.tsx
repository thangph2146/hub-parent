"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { ModeToggle } from "@/components/layouts/shared";
import { NavUser } from "@/components/layouts/navigation";
import { createPortal } from "react-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  HelpCircle,
  LucideIcon,
  LogIn,
  UserPlus,
  Home,
  FileText,
  Info,
  Mail,
} from "lucide-react";
import { Logo } from "../../../../public/svg/Logo";
import { appFeatures } from "@/lib/config/app-features";
import { getResourceMainRoute } from "@/lib/permissions/route-helpers";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TypographyPSmall,
  TypographyP,
  TypographyPSmallMuted,
  IconSize,
  TypographyH6,
} from "@/components/ui/typography";
import { Flex, Row, Col } from "antd";
import { useRouter } from "next/navigation";

/**
 * Helper functions để lấy routes từ appFeatures
 */
function getRouteFromFeature(key: string): string | null {
  const feature = appFeatures.find((f) => f.key === key);
  if (!feature?.navigation) return null;

  const nav = feature.navigation;
  if (nav.href) return nav.href;

  if (nav.resourceName) {
    const route = getResourceMainRoute(nav.resourceName);
    return route?.path || null;
  }

  return null;
}

/**
 * Lấy tất cả public features từ appFeatures
 * Sắp xếp theo order
 */
function getPublicFeatures() {
  return appFeatures
    .filter((feature) => feature.navigation?.group === "public")
    .sort((a, b) => (a.navigation?.order || 0) - (b.navigation?.order || 0));
}

/**
 * Convert public features thành LinkItem[]
 */
function getPublicLinks(): LinkItem[] {
  const publicFeatures = getPublicFeatures();

  // Map icon names từ app-features.ts
  const iconMap: Record<string, LucideIcon> = {
    Home,
    FileText,
    Info,
    Mail,
    HelpCircle,
  };

  return publicFeatures.map((feature) => {
    const nav = feature.navigation!;
    const href = nav.href || getRouteFromFeature(feature.key) || "#";

    // Extract icon từ React element
    const iconElement = feature.icon;
    let IconComponent: LucideIcon = Home; // Default icon

    // Lấy icon component từ React element
    if (
      iconElement &&
      typeof iconElement === "object" &&
      "type" in iconElement
    ) {
      const iconType = iconElement.type;
      // Nếu là function component, lấy tên và map
      if (typeof iconType === "function" && iconType.name) {
        IconComponent = iconMap[iconType.name] || Home;
      } else {
        IconComponent = iconType as LucideIcon;
      }
    }

    return {
      title: feature.title,
      href,
      description: feature.description,
      icon: IconComponent,
    };
  });
}

// Public routes constants - Lấy từ appFeatures
const PUBLIC_ROUTES = {
  home: getRouteFromFeature("home") || "/",
  blog: getRouteFromFeature("blog") || "/bai-viet",
  about: getRouteFromFeature("about") || "/about",
  contact: getRouteFromFeature("contact") || "/contact",
  help: getRouteFromFeature("help") || "/help",
  admin: getRouteFromFeature("dashboard") || "/admin/dashboard",
  auth: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
  },
} as const;

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

// Generate public navigation links từ appFeatures
const publicLinks: LinkItem[] = getPublicLinks();

/**
 * Public Header Component
 * Header cho public pages và auth pages
 */
export function PublicHeader() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const router = useRouter();
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Flex
      component="header"
      style={{
        position: "sticky",
        width: "100%",
        height: "3.5rem",
        borderBottom: "1px solid var(--border)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        backgroundColor: "var(--background) !important",
        backdropFilter: "blur(20px)",
        top: 0,
        zIndex: 50,
      }}
      className="top-0 z-50 border-border"
    >
      <Flex
        component="nav"
        style={{
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          height: "100%",
        }}
        align="center"
        justify="space-between"
        className="container mx-auto"
      >
        <Flex align="center" gap={16}>
          <Link
            href={PUBLIC_ROUTES.home}
            className="dark:bg-foreground rounded-md p-1"
            aria-label="Trang chủ - Trường Đại học Ngân hàng TP.HCM"
          >
            <Flex align="center" gap={8}>
              <Logo className="h-8 w-8 sm:h-10 sm:w-10" />
            </Flex>
          </Link>
            <Flex 
              vertical 
              align="flex-start" 
              justify="center"
            >
              <TypographyH6>Trường Đại học Ngân hàng</TypographyH6>
              <TypographyPSmall>Thành Phố Hồ Chí Minh</TypographyPSmall>
            </Flex>
          <Separator
              orientation="vertical"
              className={`h-6 w-px bg-border hidden lg:block`}
            />
          {mounted ? (
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {publicLinks.map((link) => {
                  // Hiển thị "Trang chủ" và "Bài viết" trực tiếp
                  if (
                    link.href === PUBLIC_ROUTES.home ||
                    link.href === PUBLIC_ROUTES.blog
                  ) {
                    return (
                      <NavigationMenuItem key={link.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={link.href}
                            className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                          >
                            {link.href === PUBLIC_ROUTES.home && (
                              <Flex align="center" gap={8}>
                                <IconSize size="sm">
                                  <link.icon />
                                </IconSize>
                                {link.title}
                              </Flex>
                            )}
                            {link.href !== PUBLIC_ROUTES.home && link.title}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  }
                  return null;
                })}
                {/* Support menu với các links còn lại */}
                {publicLinks.filter(
                  (link) =>
                    link.href !== PUBLIC_ROUTES.home &&
                    link.href !== PUBLIC_ROUTES.blog
                ).length > 0 && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent">
                      Hỗ trợ
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-background p-1 pr-1.5 pb-1.5">
                      <Row gutter={[8, 8]} className="bg-popover text-popover-foreground w-lg">
                        {publicLinks
                          .filter(
                            (link) =>
                              link.href !== PUBLIC_ROUTES.home &&
                              link.href !== PUBLIC_ROUTES.blog
                          )
                          .map((item, i) => (
                            <Col key={i} span={12}>
                              <ListItem {...item} />
                            </Col>
                          ))}
                      </Row>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <nav className="relative z-10 max-w-max flex-1 items-center justify-center hidden lg:flex">
              <div>
                <ul className="group flex flex-1 list-none items-center justify-center space-x-1">
                  {/* Skeleton cho "Trang chủ" và "Bài viết" - match với NavigationMenuItem */}
                  {/* Sử dụng cùng logic map như phần thực tế để đảm bảo thứ tự giống nhau */}
                  {publicLinks.map((link) => {
                    // Hiển thị skeleton cho "Trang chủ" và "Bài viết"
                    if (
                      link.href === PUBLIC_ROUTES.home ||
                      link.href === PUBLIC_ROUTES.blog
                    ) {
                      return (
                        <li key={link.href}>
                          <Skeleton
                            className={cn(
                              "inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2",
                              link.href === PUBLIC_ROUTES.home ? "w-[125px]" : "w-[88px]"
                            )}
                          />
                        </li>
                      );
                    }
                    return null;
                  })}
                  {/* Skeleton cho "Hỗ trợ" button nếu có links còn lại - match với NavigationMenuTrigger */}
                  {publicLinks.filter(
                    (link) =>
                      link.href !== PUBLIC_ROUTES.home &&
                      link.href !== PUBLIC_ROUTES.blog
                  ).length > 0 && (
                    <li>
                      <Skeleton className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 w-[88px]" />
                    </li>
                  )}
                </ul>
              </div>
            </nav>
          )}
        </Flex>
        {mounted ? (
          <Flex align="center" justify="flex-end" gap={8}>
            <ModeToggle />
            {isAuthenticated ? (
              <div className="hidden lg:block">
                <NavUser />
              </div>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden lg:flex">
                  <Link href={PUBLIC_ROUTES.auth.signIn}>Đăng nhập</Link>
                </Button>
                <Button asChild className="hidden lg:flex">
                  <Link href={PUBLIC_ROUTES.auth.signUp}>Đăng ký</Link>
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOpen(!open)}
              className="lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              <IconSize size="md">
                <MenuToggleIcon open={open} duration={300} />
              </IconSize>
            </Button>
          </Flex>
        ) : (
          <Flex align="center" gap={8}>
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="w-10 h-10 rounded-md" />
          </Flex>
        )}
      </Flex>
      {mounted && (
        <MobileMenu open={open} onClose={() => setOpen(false)}>
          <Flex vertical style={{ height: "100%" }}>
            {/* User Section - Top */}
            {isAuthenticated ? (
                <NavUser className="w-full" />
            ) : (
              <Flex
                gap={8}
                className="flex-col sm:flex-row"
                style={{
                  borderBottom: "1px solid hsl(var(--border))",
                  paddingTop: "1.5rem",
                  paddingBottom: "1.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Button
                  variant="default"
                  className="w-full h-auto py-3 flex flex-row items-center justify-start"
                  onClick={() => {
                    setOpen(false);
                    router.push("/auth/sign-in");
                  }}
                >
                  <Flex align="center" justify="flex-start" gap={12}>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        backgroundColor: "hsl(var(--primary) / 0.1)",
                        height: "3rem",
                        width: "3rem",
                        borderRadius: "0.375rem",
                      }}
                      className="aspect-square"
                    >
                      <IconSize size="md">
                        <LogIn />
                      </IconSize>
                    </Flex>
                    <Flex vertical align="flex-start">
                      <TypographyP>Đăng nhập</TypographyP>
                      <TypographyPSmall>
                        Đăng nhập vào tài khoản của bạn
                      </TypographyPSmall>
                    </Flex>
                  </Flex>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-auto py-3 flex flex-row items-center justify-start"
                  onClick={() => {
                    setOpen(false);
                    router.push("/auth/sign-up");
                  }}
                >
                  <Flex align="center" justify="flex-start" gap={12}>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        backgroundColor: "hsl(var(--muted))",
                        height: "3rem",
                        width: "3rem",
                        borderRadius: "0.375rem",
                      }}
                      className="aspect-square"
                    >
                      <IconSize size="md">
                        <UserPlus />
                      </IconSize>
                    </Flex>
                    <Flex vertical align="flex-start">
                      <TypographyP>Đăng ký</TypographyP>
                      <TypographyPSmallMuted>
                        Tạo tài khoản mới
                      </TypographyPSmallMuted>
                    </Flex>
                  </Flex>
                </Button>
              </Flex>
            )}

            {/* Navigation Links - Scrollable */}
            <Flex vertical gap={4} style={{ flex: 1, overflow: "auto", width: "100%" }}>
              {publicLinks.map((link) => {
                // Hiển thị "Trang chủ" và "Bài viết" trực tiếp
                if (
                  link.href === PUBLIC_ROUTES.home ||
                  link.href === PUBLIC_ROUTES.blog
                ) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group w-full hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-3 transition-colors active:bg-accent/80"
                      onClick={() => setOpen(false)}
                    >
                      <Flex align="center" gap={12} className="flex-row">
                        <Flex
                          align="center"
                          justify="center"
                          className="bg-background/40 aspect-square size-11 rounded-lg border shadow-sm shrink-0 group-hover:bg-background/60 transition-colors"
                        >
                          <IconSize size="md">
                            <link.icon />
                          </IconSize>
                        </Flex>
                        <Flex
                          vertical
                          align="flex-start"
                          justify="center"
                          className="min-w-0 flex-1"
                        >
                          <TypographyP className="group-hover:text-foreground group-focus-visible:text-foreground transition-colors">
                            {link.title}
                          </TypographyP>
                          {link.description && (
                            <TypographyPSmall className="group-hover:text-foreground/80 group-focus-visible:text-foreground transition-colors">
                              {link.description}
                            </TypographyPSmall>
                          )}
                        </Flex>
                      </Flex>
                    </Link>
                  );
                }
                return null;
              })}
              {/* Hiển thị các links còn lại dưới label "Hỗ trợ" */}
              {publicLinks.filter(
                (link) =>
                  link.href !== PUBLIC_ROUTES.home &&
                  link.href !== PUBLIC_ROUTES.blog
              ).length > 0 && (
                <>
                  <TypographyPSmallMuted className="px-2 py-2 uppercase tracking-wider">
                    Hỗ trợ
                  </TypographyPSmallMuted>
                  {publicLinks
                    .filter(
                      (link) =>
                        link.href !== PUBLIC_ROUTES.home &&
                        link.href !== PUBLIC_ROUTES.blog
                    )
                    .map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group w-full hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-3 transition-colors active:bg-accent/80"
                        onClick={() => setOpen(false)}
                      >
                        <Flex align="center" gap={12} className="flex-row">
                          <Flex
                            align="center"
                            justify="center"
                            className="bg-background/40 aspect-square size-11 rounded-lg border shadow-sm shrink-0 group-hover:bg-background/60 transition-colors"
                          >
                            <IconSize size="md">
                              <link.icon />
                            </IconSize>
                          </Flex>
                          <Flex
                            vertical
                            align="flex-start"
                            justify="center"
                            className="min-w-0 flex-1"
                          >
                            <TypographyP className="group-hover:text-foreground group-focus-visible:text-foreground transition-colors">
                              {link.title}
                            </TypographyP>
                            {link.description && (
                              <TypographyPSmall className="group-hover:text-foreground/80 group-focus-visible:text-foreground transition-colors">
                                {link.description}
                              </TypographyPSmall>
                            )}
                          </Flex>
                        </Flex>
                      </Link>
                    ))}
                </>
              )}
            </Flex>
          </Flex>
        </MobileMenu>
      )}
    </Flex>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & {
  open: boolean;
  onClose?: () => void;
};

function MobileMenu({
  open,
  children,
  className,
  onClose,
  ...props
}: MobileMenuProps) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        "bg-background",
        "fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y lg:hidden"
      )}
      onClick={(e) => {
        // Close menu when clicking on backdrop
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        data-slot={open ? "open" : "closed"}
        className={cn(
          "data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out",
          "size-full p-4 container mx-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn(
        "group w-full flex flex-row gap-x-2 data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm p-2",
        className
      )}
      {...props}
      asChild
    >
      <Link href={href}>
        <Flex align="center" gap={8} className="flex-row">
          <Flex
            align="center"
            justify="center"
            className="bg-background/40 aspect-square size-12 rounded-md border shadow-sm"
          >
            <IconSize size="md">
              <Icon />
            </IconSize>
          </Flex>
          <Flex vertical align="flex-start" justify="center">
            <TypographyP className="text-popover-foreground">{title}</TypographyP>
            {description && <TypographyPSmall className="text-popover-foreground/80">{description}</TypographyPSmall>}
          </Flex>
        </Flex>
      </Link>
    </NavigationMenuLink>
  );
}
