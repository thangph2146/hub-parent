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
  LifeBuoy,
  Command,
  Home,
  FileText,
  Info,
  Mail,
} from "lucide-react";
import { Logo } from "../../../../public/svg/Logo"
import { appFeatures } from "@/lib/config/app-features";
import { getResourceMainRoute } from "@/lib/permissions/route-helpers";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyPSmall, TypographyP, TypographyPSmallMuted, IconSize } from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";

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
  const scrolled = useScroll(10);
  const { data: session } = useSession();
  const isAuthenticated = !!session;

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
    <header
      className={cn("sticky top-0 z-50 w-full border-b border-transparent", {
        "bg-background/95 supports-[backdrop-filter]:bg-background/70 border-border backdrop-blur-lg":
          scrolled,
      })}
    >
      <nav className="container mx-auto h-14 w-full">
        <Flex align="center" justify="between" className="h-full">
          <Flex align="center" gap={4}>
            <Link
              href={PUBLIC_ROUTES.home}
              className="dark:bg-foreground rounded-md p-1"
              aria-label="Trang chủ - Trường Đại học Ngân hàng TP.HCM"
            >
              <Flex align="center" gap={2}>
                <Logo className="h-8 w-8 sm:h-10 sm:w-10 text-blue-100" />
              </Flex>
            </Link>
          {/* <Flex direction="col">
            <TypographyH6>
              Trường Đại học Ngân hàng
            </TypographyH6>
            <TypographyPSmall>Thành Phố Hồ Chí Minh</TypographyPSmall>
          </Flex> */}
            <Separator orientation="vertical" className={`h-6 w-px bg-border`} />
            {mounted ? (
              <NavigationMenu className="hidden md:flex">
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
                                <Flex align="center" gap={2}>
                                  <IconSize size="sm"><link.icon /></IconSize>
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
                          <Grid cols={2} gap={2} className="bg-popover w-lg">
                            {publicLinks
                              .filter(
                                (link) =>
                                  link.href !== PUBLIC_ROUTES.home &&
                                  link.href !== PUBLIC_ROUTES.blog
                              )
                              .map((item, i) => (
                                <ListItem key={i} {...item} />
                              ))}
                          </Grid>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    )}
                </NavigationMenuList>
              </NavigationMenu>
            ) : (
              <Flex align="center" gap={4} className="hidden md:flex">
                {publicLinks.slice(0, 2).map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="bg-transparent"
                    asChild
                  >
                    <Link href={link.href}>{link.title}</Link>
                  </Button>
                ))}
              </Flex>
            )}
          </Flex>
        {mounted ? (
          <Flex align="center" gap={2}> 
            <ModeToggle />
            {isAuthenticated ? (
              <Flex className="hidden md:flex">
                <NavUser />
              </Flex>
            ) : (
              <>
                <Button variant="outline" asChild className="hidden md:flex">
                  <Link href={PUBLIC_ROUTES.auth.signIn}>Đăng nhập</Link>
                </Button>
                <Button asChild className="hidden md:flex">
                  <Link href={PUBLIC_ROUTES.auth.signUp}>Đăng ký</Link>
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOpen(!open)}
              className="md:hidden"
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
          <Flex align="center" gap={2}>
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="w-10 h-10 rounded-md" />
          </Flex>
        )}
        </Flex>
      </nav>
      {mounted && (
        <MobileMenu open={open} onClose={() => setOpen(false)}>
          <Flex direction="col" className="h-full">
            {/* User Section - Top */}
            {isAuthenticated ? (
              <Flex direction="col" className="border-b pb-4 mb-4 w-full">
                <NavUser className="w-full" />
              </Flex>
            ) : (
              <Flex direction="col" gap={2} className="border-b pb-4 mb-4">
                <Button
                  variant="default"
                  className="w-full h-auto py-3"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/auth/sign-in">
                    <Flex align="center" gap={3} className="justify-start">
                      <Flex align="center" justify="center" className="bg-primary/10 aspect-square h-12 w-12 rounded-md">
                        <IconSize size="md"><LogIn /></IconSize>
                      </Flex>
                      <Flex direction="col" align="start">
                        <TypographyP>Đăng nhập</TypographyP>
                        <TypographyPSmallMuted>
                          Đăng nhập vào tài khoản của bạn
                        </TypographyPSmallMuted>
                      </Flex>
                    </Flex>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-auto py-3"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/auth/sign-up">
                    <Flex align="center" gap={3} className="justify-start">
                      <Flex align="center" justify="center" className="bg-muted aspect-square h-12 w-12 rounded-md">
                        <IconSize size="md"><UserPlus /></IconSize>
                      </Flex>
                      <Flex direction="col" align="start">
                        <TypographyP>Đăng ký</TypographyP>
                        <TypographyPSmallMuted>
                          Tạo tài khoản mới
                        </TypographyPSmallMuted>
                      </Flex>
                    </Flex>
                  </Link>
                </Button>
              </Flex>
            )}

            {/* Navigation Links - Scrollable */}
            <Flex direction="col" gap={1} className="flex-1 overflow-y-auto w-full">
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
                        className="group w-full hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-3 transition-colors active:bg-accent/80"
                        onClick={() => setOpen(false)}
                      >
                        <Flex align="center" gap={3} className="flex-row">
                          <Flex align="center" justify="center" className="bg-background/40 aspect-square size-11 rounded-lg border shadow-sm shrink-0 group-hover:bg-background/60 transition-colors">
                            <IconSize size="md"><link.icon /></IconSize>
                          </Flex>
                          <Flex direction="col" align="start" justify="center" className="min-w-0 flex-1">
                            <TypographyP className="group-hover:text-accent-foreground group-focus-visible:text-accent-foreground transition-colors">
                              {link.title}
                            </TypographyP>
                            {link.description && (
                              <TypographyPSmall className="group-hover:text-accent-foreground/80 group-focus-visible:text-accent-foreground transition-colors">
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
                            className="group w-full hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-3 transition-colors active:bg-accent/80"
                            onClick={() => setOpen(false)}
                          >
                            <Flex align="center" gap={3} className="flex-row">
                              <Flex align="center" justify="center" className="bg-background/40 aspect-square size-11 rounded-lg border shadow-sm shrink-0 group-hover:bg-background/60 transition-colors">
                                <IconSize size="md"><link.icon /></IconSize>
                              </Flex>
                              <Flex direction="col" align="start" justify="center" className="min-w-0 flex-1">
                                <TypographyP className="group-hover:text-accent-foreground group-focus-visible:text-accent-foreground transition-colors">
                                  {link.title}
                                </TypographyP>
                                {link.description && (
                                  <TypographyPSmall className="group-hover:text-accent-foreground/80 group-focus-visible:text-accent-foreground transition-colors">
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
    </header>
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
        "bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg",
        "fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden"
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
          "size-full p-4",
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
        <Flex align="center" gap={2} className="flex-row">
          <Flex align="center" justify="center" className="bg-background/40 aspect-square size-12 rounded-md border shadow-sm">
            <IconSize size="md"><Icon /></IconSize>
          </Flex>
          <Flex direction="col" align="start" justify="center">
            <TypographyP>{title}</TypographyP>
            {description && <TypographyPSmall>{description}</TypographyPSmall>}
          </Flex>
        </Flex>
      </Link>
    </NavigationMenuLink>
  );
}

/**
 * Convert appFeatures thành LinkItem[] cho support section
 * Lấy các features thuộc group "secondary"
 */
function getSupportLinks(): LinkItem[] {
  // Map icon components từ appFeatures
  const iconMap: Record<string, LucideIcon> = {
    support: LifeBuoy,
    feedback: Command,
  };

  const supportFeatures = appFeatures.filter(
    (feature) => feature.navigation?.group === "secondary"
  );

  return supportFeatures.map((feature) => {
    const nav = feature.navigation!;
    const href = nav.href || "#";

    // Lấy icon từ map dựa trên feature key
    const icon = iconMap[feature.key] || HelpCircle;

    return {
      title: feature.title,
      href,
      description: feature.description,
      icon,
    };
  });
}

// Generate links từ appFeatures
const _supportLinks: LinkItem[] = getSupportLinks();

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  // also check on first load
  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}
