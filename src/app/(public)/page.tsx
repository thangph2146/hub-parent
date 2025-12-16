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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    // Theo Next.js docs: Open Graph images must be absolute URLs
    // Đảm bảo tất cả các thuộc tính đều đúng format
    type: openGraphConfig.type,
    locale: openGraphConfig.locale,
    // Sử dụng relative URL, Next.js sẽ tự động resolve từ metadataBase
    url: "/",
    siteName: openGraphConfig.siteName,
    title: appConfig.titleDefault,
    description: appConfig.description,
    // Images phải là absolute URLs với đầy đủ width, height, alt
    images: openGraphConfig.images?.map((img) => ({
      url: img.url, // Đã là absolute URL từ appConfig
      width: img.width,
      height: img.height,
      alt: img.alt,
    })),
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
