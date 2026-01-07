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
  IconSize,
  TypographyH6,
} from "@/components/ui/typography";
import { Flex } from "@/components/ui/flex";
import { Grid } from "@/components/ui/grid";
import { useRouter } from "next/navigation";

// Types
type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

// Helper functions
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

function getPublicLinks(): LinkItem[] {
  const iconMap: Record<string, LucideIcon> = {
    Home,
    FileText,
    Info,
    Mail,
    HelpCircle,
  };

  return appFeatures
    .filter((f) => f.navigation?.group === "public")
    .sort((a, b) => (a.navigation?.order || 0) - (b.navigation?.order || 0))
    .map((feature) => {
      const nav = feature.navigation!;
      const href = nav.href || getRouteFromFeature(feature.key) || "#";
      
      let IconComponent: LucideIcon = Home;
      const iconElement = feature.icon;
      if (iconElement && typeof iconElement === "object" && "type" in iconElement) {
        const iconType = iconElement.type;
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

const publicLinks: LinkItem[] = getPublicLinks();
const mainLinks = publicLinks.filter(
  (link) => link.href === PUBLIC_ROUTES.home || link.href === PUBLIC_ROUTES.blog
);
const supportLinks = publicLinks.filter(
  (link) => link.href !== PUBLIC_ROUTES.home && link.href !== PUBLIC_ROUTES.blog
);

// Components
function AuthButton({
  icon: Icon,
  title,
  description,
  href,
  variant = "default",
  iconBg,
  onClose,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  variant?: "default" | "outline";
  iconBg?: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  return (
    <Button
      variant={variant}
      className={cn(
        "w-full sm:w-1/2 h-auto",
        "py-3 px-3 sm:py-3.5 sm:px-4",
        "flex flex-row items-center justify-start rounded-lg max-w-full",
        "touch-action-manipulation tap-highlight-transparent",
        "active:scale-[0.98] transition-transform"
      )}
      onClick={() => {
        onClose?.();
        router.push(href);
      }}
    >
      <Flex align="center" justify="start" gap={2.5} className="w-full min-w-0 sm:gap-3">
        <Flex
          align="center"
          justify="center"
          className={cn(
            iconBg || "bg-primary/10 dark:bg-primary/20",
            "aspect-square size-10 sm:size-12 rounded-lg shrink-0",
            variant === "outline" && "border border-border"
          )}
        >
          <IconSize size="sm" className="sm:w-5 sm:h-5">
            <Icon />
          </IconSize>
        </Flex>
        <Flex direction="col" align="start" className="min-w-0 flex-1">
          <TypographyP className="font-medium text-sm sm:text-base">{title}</TypographyP>
          <TypographyPSmall className="text-xs sm:text-sm">{description}</TypographyPSmall>
        </Flex>
      </Flex>
    </Button>
  );
}

function MobileNavLink({
  link,
  onClose,
  iconBg = "bg-accent/10 dark:bg-accent/20",
}: {
  link: LinkItem;
  onClose: () => void;
  iconBg?: string;
}) {
  return (
    <Link
      href={link.href}
      className={cn(
        "group w-full rounded-lg p-3.5 transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:bg-accent focus-visible:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "active:bg-accent/80 active:scale-[0.98]",
        "touch-action-manipulation -webkit-tap-highlight-color-transparent"
      )}
      onClick={onClose}
    >
      <Flex align="center" gap={3} className="flex-row">
        <Flex
          align="center"
          justify="center"
          className={cn(
            iconBg,
            "aspect-square size-12 rounded-lg border border-border shrink-0",
            "group-hover:bg-background/80 group-hover:border-border group-hover:shadow-sm",
            "transition-colors duration-200"
          )}
        >
          <IconSize size="md">
            <link.icon />
          </IconSize>
        </Flex>
        <Flex direction="col" align="start" justify="center" className="min-w-0 flex-1">
          <TypographyP
            className={cn(
              "font-medium transition-colors duration-200",
              "group-hover:text-accent-foreground group-focus-visible:text-accent-foreground"
            )}
          >
            {link.title}
          </TypographyP>
          {link.description && (
            <TypographyPSmall
              className={cn(
                "mt-0.5 opacity-80 transition-colors duration-200",
                "group-hover:text-accent-foreground/80 group-focus-visible:text-accent-foreground/80"
              )}
            >
              {link.description}
            </TypographyPSmall>
          )}
        </Flex>
      </Flex>
    </Link>
  );
}

function MobileMenu({
  open,
  onClose,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  open: boolean;
  onClose?: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  if (!open || !mounted || typeof window === "undefined") return null;

  return createPortal(
    <>
      <div
        data-slot={open ? "open" : "closed"}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden",
          "data-[slot=open]:animate-in data-[slot=open]:fade-in-0",
          "data-[slot=closed]:animate-out data-[slot=closed]:fade-out-0",
          "duration-200 ease-out"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id="mobile-menu"
        data-slot={open ? "open" : "closed"}
        className={cn(
          "bg-background fixed top-14 right-0 bottom-0 left-0 z-50",
          "flex flex-col overflow-hidden border-t border-border",
          "data-[slot=open]:animate-in data-[slot=open]:slide-in-from-top-2 data-[slot=open]:fade-in-0",
          "data-[slot=closed]:animate-out data-[slot=closed]:slide-out-to-top-2 data-[slot=closed]:fade-out-0",
          "duration-300 ease-out lg:hidden pb-safe overflow-y-auto scrollbar-hide"
        )}
        style={{ touchAction: "pan-y" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
      >
        <div
          className={cn("size-full p-4 sm:p-6 container mx-auto max-w-full", className)}
          {...props}
        >
          {children}
        </div>
      </div>
    </>,
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
        "group w-full flex flex-row gap-x-2 rounded-sm p-2 transition-colors",
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent",
        "data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground focus:outline-none",
        className
      )}
      {...props}
      asChild
    >
      <Link href={href} className="w-full">
        <Flex align="center" gap={2} direction="row" className="w-full">
          <Flex
            align="center"
            justify="center"
            className={cn(
              "bg-background/40 aspect-square size-12 rounded-md border shadow-sm",
              "group-hover:bg-background/60 group-hover:border-accent/50",
              "transition-colors duration-200"
            )}
          >
            <IconSize size="md">
              <Icon />
            </IconSize>
          </Flex>
          <Flex direction="col" align="start" justify="center">
            <TypographyP className={cn(
              "text-popover-foreground transition-colors",
              "group-hover:text-accent-foreground group-focus:text-accent-foreground",
              "data-[active=true]:text-accent-foreground"
            )}>
              {title}
            </TypographyP>
            {description && (
              <TypographyPSmall className={cn(
                "text-popover-foreground/80 transition-colors",
                "group-hover:text-accent-foreground/90 group-focus:text-accent-foreground/90",
                "data-[active=true]:text-accent-foreground/90"
              )}>
                {description}
              </TypographyPSmall>
            )}
          </Flex>
        </Flex>
      </Link>
    </NavigationMenuLink>
  );
}

// Main Component
export function PublicHeader() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Flex
      as="header"
      data-public-header="true"
      position="sticky"
      width="full"
      height="14"
      border="bottom"
      paddingX="4"
      bg="background"
      style={{ backdropFilter: "blur(20px)", top: 0, zIndex: 50 }}
      className="top-0 z-50 border-border"
    >
      <Flex as="nav" width="full" height="full" align="center" justify="between" container>
        <Flex align="center" gap={4}>
          <Link
            href={PUBLIC_ROUTES.home}
            className="dark:bg-foreground rounded-md p-1"
            aria-label="Trang chủ - Trường Đại học Ngân hàng TP.HCM"
          >
            <Logo className="h-8 w-8 sm:h-10 sm:w-10" />
          </Link>
          <Flex direction="col" align="start" justify="center">
            <TypographyH6>Trường Đại học Ngân hàng</TypographyH6>
            <TypographyPSmall>Thành Phố Hồ Chí Minh</TypographyPSmall>
          </Flex>
          <Separator
            orientation="vertical"
            className="h-6 w-px bg-border hidden lg:block"
          />
          {mounted ? (
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {mainLinks.map((link) => (
                  <NavigationMenuItem key={link.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "group inline-flex h-10 w-max items-center justify-center rounded-md",
                          "bg-transparent px-4 py-2 transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                          "disabled:pointer-events-none disabled:opacity-50",
                          "data-[active]:bg-accent/50 data-[active]:text-accent-foreground",
                          "data-[state=open]:bg-accent/50 data-[state=open]:text-accent-foreground"
                        )}
                      >
                        {link.href === PUBLIC_ROUTES.home ? (
                          <Flex align="center" gap={2}>
                            <IconSize size="sm">
                              <link.icon />
                            </IconSize>
                            {link.title}
                          </Flex>
                        ) : (
                          link.title
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
                {supportLinks.length > 0 && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className={cn(
                      "bg-transparent transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground",
                      "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                    )}>
                      Hỗ trợ
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-popover text-popover-foreground p-1 pr-1.5 pb-1.5 border border-border shadow-lg">
                      <Grid
                        cols={supportLinks.length <= 2 ? 1 : 2}
                        gap={2}
                        className={cn(
                          "w-auto",
                          supportLinks.length <= 2 
                            ? "min-w-[400px] max-w-sm" 
                            : "min-w-[500px] max-w-lg"
                        )}
                      >
                        {supportLinks.map((item, i) => (
                          <div key={i} className="w-full">
                            <ListItem {...item} />
                          </div>
                        ))}
                      </Grid>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <nav className="relative z-10 max-w-max flex-1 items-center justify-center hidden lg:flex">
              <ul className="group flex flex-1 list-none items-center justify-center space-x-1">
                {mainLinks.map((link) => (
                  <li key={link.href}>
                    <Skeleton
                      className={cn(
                        "inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2",
                        link.href === PUBLIC_ROUTES.home ? "w-[125px]" : "w-[88px]"
                      )}
                    />
                  </li>
                ))}
                {supportLinks.length > 0 && (
                  <li>
                    <Skeleton className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 w-[88px]" />
                  </li>
                )}
              </ul>
            </nav>
          )}
        </Flex>
        {mounted ? (
          <Flex align="center" justify="end" gap={2}>
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
          <Flex align="center" gap={2}>
            <Skeleton className="w-10 h-10 rounded-md" />
            <Skeleton className="w-10 h-10 rounded-md" />
          </Flex>
        )}
      </Flex>
      {mounted && (
        <MobileMenu open={open} onClose={() => setOpen(false)}>
          <Flex direction="col" height="full" gap={0}>
            {isAuthenticated ? (
              <div className="w-full pb-4 border-b border-border">
                <NavUser className="w-full" />
              </div>
            ) : (
              <Flex
                direction="col-sm-row"
                gap={2}
                border="bottom"
                paddingY="4"
                paddingX="0"
                className="pb-4 w-full"
              >
                <AuthButton
                  icon={LogIn}
                  title="Đăng nhập"
                  description="Đăng nhập vào tài khoản của bạn"
                  href={PUBLIC_ROUTES.auth.signIn}
                  variant="default"
                  onClose={() => setOpen(false)}
                />
                <AuthButton
                  icon={UserPlus}
                  title="Đăng ký"
                  description="Tạo tài khoản mới"
                  href={PUBLIC_ROUTES.auth.signUp}
                  variant="outline"
                  iconBg="bg-accent/10 dark:bg-accent/20"
                  onClose={() => setOpen(false)}
                />
              </Flex>
            )}
            <Flex
              direction="col"
              gap={1.5}
              flex="1"
              overflow="auto"
              width="full"
              className="mt-4 -mx-4 px-4"
            >
              {mainLinks.map((link) => (
                <MobileNavLink key={link.href} link={link} onClose={() => setOpen(false)} />
              ))}
              {supportLinks.length > 0 && (
                <>
                  <div className="pt-2 pb-1.5">
                    <TypographyPSmall className="px-2 uppercase tracking-wider font-semibold opacity-70">
                      Hỗ trợ
                    </TypographyPSmall>
                  </div>
                  {supportLinks.map((link) => (
                    <MobileNavLink
                      key={link.href}
                      link={link}
                      onClose={() => setOpen(false)}
                      iconBg="bg-muted/50 dark:bg-muted/30"
                    />
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