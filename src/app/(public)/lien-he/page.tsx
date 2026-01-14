import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { Contact } from "@/features/public/contact/components"
import Script from "next/script"

/**
 * Contact Page Metadata
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
    absolute: `Liên hệ | ${appConfig.name}`,
  },
  description: `Liên hệ với ${appConfig.namePublic || appConfig.name}. Gửi tin nhắn cho chúng tôi về bất kỳ vấn đề nào cần được giải quyết.`,
  alternates: {
    canonical: "/lien-he",
  },
  openGraph: {
    ...openGraphConfig,
    url: `${appConfig.url}/lien-he`,
    title: `Liên hệ - ${appConfig.name}`,
    description: `Liên hệ với ${appConfig.namePublic || appConfig.name}. Gửi tin nhắn cho chúng tôi về bất kỳ vấn đề nào cần được giải quyết.`,
    // Giữ lại images từ appConfig
    images: openGraphConfig.images,
  },
  twitter: {
    ...twitterConfig,
    title: `Liên hệ - ${appConfig.name}`,
    description: `Liên hệ với ${appConfig.namePublic || appConfig.name}. Gửi tin nhắn cho chúng tôi về bất kỳ vấn đề nào cần được giải quyết.`,
    // Giữ lại images từ appConfig
    images: twitterConfig.images,
  },
}

export default async function ContactPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Liên hệ với chúng tôi - HUB",
    "description": "Thông tin liên hệ và biểu mẫu gửi tin nhắn cho Trường Đại học Ngân hàng TP.HCM.",
    "url": `${appConfig.url}/lien-he`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "(028) 38 212 430",
      "contactType": "customer service",
      "email": "dhnhtphcm@hub.edu.vn",
      "areaServed": "VN",
      "availableLanguage": "Vietnamese"
    }
  };

  return (
    <>
      <Script
        id="contact-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Contact />
    </>
  )
}

