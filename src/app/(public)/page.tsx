import type { Metadata } from "next";
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/lib/config";
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
const openGraphConfig = getOpenGraphConfig();
const twitterConfig = getTwitterConfig();

export const metadata: Metadata = {
  title: {
    absolute: appConfig.titleDefault,
  },
  description: appConfig.description,
  openGraph: {
    ...openGraphConfig,
    url: appConfig.url,
    title: appConfig.titleDefault,
    description: appConfig.description,
    // Giữ lại images từ appConfig để hiển thị khi chia sẻ
    images: openGraphConfig.images,
  },
  twitter: {
    ...twitterConfig,
    title: appConfig.titleDefault,
    description: appConfig.description,
    // Giữ lại images từ appConfig để hiển thị khi chia sẻ
    images: twitterConfig.images,
  },
};

export default async function HomePage() {
  return <Home />;
}
