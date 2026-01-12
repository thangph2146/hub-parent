import type { Metadata } from "next";
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { Home } from "@/features/public/home/components";

/**
 * Home Page Metadata
 *
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với trang nội dung công khai
 * - Open Graph và Twitter Card cho social sharing
 * - Sử dụng appConfig để đảm bảo tính nhất quán
 */
const twitterConfig = getTwitterConfig();

export const metadata: Metadata = {
  title: {
    absolute: appConfig.titleDefault,
  },
  description: appConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    ...getOpenGraphConfig(),
    url: "/",
    title: appConfig.titleDefault,
    description: appConfig.description,
  },
  twitter: {
    ...twitterConfig,
    title: appConfig.titleDefault,
    description: appConfig.description,
    // Twitter images cũng phải là absolute URLs
    images: twitterConfig.images,
  },
};

export default async function HomePage() {
  return <Home />;
}
