import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/lib/config"
import { GuideClient } from "@/features/public/help/components/guide-client"

/**
 * Guide Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với page phụ huynh
 * - Open Graph và Twitter Card cho social sharing
 * - Sử dụng appConfig để đảm bảo tính nhất quán
 */
export const metadata: Metadata = {
  title: {
    absolute: `Hướng dẫn sử dụng | ${appConfig.titleDefault}`,
  },
  description: `Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của ${appConfig.namePublic || appConfig.name}`,
  openGraph: {
    ...getOpenGraphConfig(),
    title: `Hướng dẫn sử dụng - ${appConfig.name}`,
    description: `Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của ${appConfig.namePublic || appConfig.name}`,
  },
  twitter: {
    ...getTwitterConfig(),
    title: `Hướng dẫn sử dụng - ${appConfig.name}`,
    description: `Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của ${appConfig.namePublic || appConfig.name}`,
  },
}

export default async function GuidePage() {
  return <GuideClient />
}

