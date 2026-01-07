import { getRouteFromFeature } from "@/lib/utils";

export const HOME_ROUTES = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  help: getRouteFromFeature("help") || "/help",
  aboutHub: "/about-hub",
  posts: "/bai-viet",
} as const;

export const HOME_RESPONSIVE_CONDITIONS = {
  // Điều kiện để hiển thị ScrollIndicator và cho phép fullHeight
  showScrollIndicator: (width: number, height: number) => width > 1280 && height > 630,
  // Điều kiện cho fullHeight của các section
  isDesktop: (width: number) => width > 1280,
};
