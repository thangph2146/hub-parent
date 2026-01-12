import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { GuideClient } from "@/features/public/help"

/**
 * Guide Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với page phụ huynh
 * - Open Graph và Twitter Card cho social sharing
 * - Sử dụng appConfig để đảm bảo tính nhất quán
 */
const openGraphConfig = getOpenGraphConfig();
const twitterConfig = getTwitterConfig();

export const metadata: Metadata = {
  title: {
    absolute: `Hướng dẫn sử dụng | ${appConfig.name}`,
  },
  description: `Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của ${appConfig.namePublic || appConfig.name}`,
  openGraph: {
    ...openGraphConfig,
    url: `${appConfig.url}/huong-dan-su-dung`,
    title: `Hướng dẫn sử dụng - ${appConfig.name}`,
    description: `Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của ${appConfig.namePublic || appConfig.name}`,
    // Giữ lại images từ appConfig
    images: openGraphConfig.images,
  },
  twitter: {
    ...twitterConfig,
    title: `Hướng dẫn sử dụng - ${appConfig.name}`,
    description: `Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của ${appConfig.namePublic || appConfig.name}`,
    // Giữ lại images từ appConfig
    images: twitterConfig.images,
  },
}

export default async function GuidePage() {
  return <GuideClient />
}

