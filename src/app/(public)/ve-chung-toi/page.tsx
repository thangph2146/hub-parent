import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { About } from "@/features/public/about/components"

/**
 * About Page Metadata
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
    absolute: `Về chúng tôi | ${appConfig.name}`,
  },
  description: `${appConfig.namePublic || appConfig.name} - ${appConfig.description}`,
  openGraph: {
    ...openGraphConfig,
    url: `${appConfig.url}/ve-chung-toi`,
    title: `Về chúng tôi - ${appConfig.name}`,
    description: `${appConfig.namePublic || appConfig.name} - ${appConfig.description}`,
    // Giữ lại images từ appConfig
    images: openGraphConfig.images,
  },
  twitter: {
    ...twitterConfig,
    title: `Về chúng tôi - ${appConfig.name}`,
    description: `${appConfig.namePublic || appConfig.name} - ${appConfig.description}`,
    // Giữ lại images từ appConfig
    images: twitterConfig.images,
  },
}

export default async function AboutPage() {
  return <About />
}

