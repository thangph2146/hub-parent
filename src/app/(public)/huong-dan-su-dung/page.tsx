import type { Metadata } from "next"
import { getOpenGraphConfig, getTwitterConfig } from "@/lib/config"
import { GuideClient } from "@/features/public/help/components/guide-client"

/**
 * Guide Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với page phụ huynh
 * - Open Graph và Twitter Card cho social sharing
 */
export const metadata: Metadata = {
  title: "Hướng dẫn sử dụng",
  description: "Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của Trường Đại học Ngân hàng TP.Hồ Chí Minh",
  openGraph: {
    ...getOpenGraphConfig(),
    title: "Hướng dẫn sử dụng - Trường Đại học Ngân hàng TP.HCM",
    description: "Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của Trường Đại học Ngân hàng TP.Hồ Chí Minh",
    siteName: "Trường Đại học Ngân hàng TP.HCM",
  },
  twitter: {
    ...getTwitterConfig(),
    title: "Hướng dẫn sử dụng - Trường Đại học Ngân hàng TP.HCM",
    description: "Hướng dẫn chi tiết cách sử dụng hệ thống và các dịch vụ của Trường Đại học Ngân hàng TP.Hồ Chí Minh",
  },
}

export default async function GuidePage() {
  return <GuideClient />
}

