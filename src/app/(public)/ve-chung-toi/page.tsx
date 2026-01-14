import type { Metadata } from "next"
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { About } from "@/features/public/about/components"
import Script from "next/script"

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
  alternates: {
    canonical: "/ve-chung-toi",
  },
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Về chúng tôi - HUB",
    "description": appConfig.description,
    "url": `${appConfig.url}/ve-chung-toi`,
    "mainEntity": {
      "@type": "Organization",
      "name": "Trường Đại học Ngân hàng TP.HCM",
      "url": "https://hub.edu.vn",
      "logo": "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095355z6676952814172_23a84367b5e409bfcea8b8e95ac6ba4c.jpg",
      "description": "Trường Đại học Ngân hàng TP. Hồ Chí Minh là một trong những trường đại học hàng đầu về lĩnh vực kinh tế, tài chính và ngân hàng tại Việt Nam."
    }
  };

  return (
    <>
      <Script
        id="about-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <About />
    </>
  )
}

