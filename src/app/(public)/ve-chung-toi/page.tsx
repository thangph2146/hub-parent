import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/lib/config"
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
export const metadata: Metadata = {
  title: {
    absolute: `Về chúng tôi | ${appConfig.titleDefault}`,
  },
  description: `${appConfig.namePublic || appConfig.name} - ${appConfig.description}`,
  openGraph: {
    ...getOpenGraphConfig(),
    title: `Về chúng tôi - ${appConfig.name}`,
    description: `${appConfig.namePublic || appConfig.name} - ${appConfig.description}`,
  },
  twitter: {
    ...getTwitterConfig(),
    title: `Về chúng tôi - ${appConfig.name}`,
    description: `${appConfig.namePublic || appConfig.name} - ${appConfig.description}`,
  },
}

export default async function AboutPage() {
  return <About />
}

