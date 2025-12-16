import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/lib/config"
import { Contact } from "@/features/public/contact/components"

/**
 * Contact Page Metadata
 * 
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với page phụ huynh
 * - Open Graph và Twitter Card cho social sharing
 * - Sử dụng appConfig để đảm bảo tính nhất quán
 */
export const metadata: Metadata = {
  title: {
    absolute: `Liên hệ | ${appConfig.titleDefault}`,
  },
  description: `Liên hệ với ${appConfig.namePublic || appConfig.name}. Gửi tin nhắn cho chúng tôi về bất kỳ vấn đề nào cần được giải quyết.`,
  openGraph: {
    ...getOpenGraphConfig(),
    title: `Liên hệ - ${appConfig.name}`,
    description: `Liên hệ với ${appConfig.namePublic || appConfig.name}. Gửi tin nhắn cho chúng tôi về bất kỳ vấn đề nào cần được giải quyết.`,
  },
  twitter: {
    ...getTwitterConfig(),
    title: `Liên hệ - ${appConfig.name}`,
    description: `Liên hệ với ${appConfig.namePublic || appConfig.name}. Gửi tin nhắn cho chúng tôi về bất kỳ vấn đề nào cần được giải quyết.`,
  },
}

export default async function ContactPage() {
  return <Contact />
}

