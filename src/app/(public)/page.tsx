import type { Metadata } from "next";
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"
import { Home } from "@/features/public/home/components";
import Script from "next/script";

/**
 * Home Page Metadata
 *
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với trang nội dung công khai
 * - Open Graph và Twitter Card cho social sharing
 * - Sử dụng appConfig để đảm bảo tính nhất quán
 */
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
    ...getOpenGraphConfig(),
    url: "/",
    title: appConfig.titleDefault,
    description: appConfig.description,
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": appConfig.name,
    "alternateName": appConfig.namePublic,
    "url": appConfig.url,
    "description": appConfig.description,
    "publisher": {
      "@type": "Organization",
      "name": "Trường Đại học Ngân hàng TP.HCM",
      "url": "https://hub.edu.vn",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095355z6676952814172_23a84367b5e409bfcea8b8e95ac6ba4c.jpg"
      },
      "sameAs": [
        "https://www.facebook.com/DHNH.HUB",
        "https://www.youtube.com/@truongdaihocnganhangtphcmhub"
      ]
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${appConfig.url}/bai-viet?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <Script
        id="home-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Home />
    </>
  );
}
