/**
 * Global application configuration
 */

export const appConfig = {
  // Basic metadata
  titleDefault: "HUB - Kết nối phụ huynh và nhà trường",
  titleTemplate: "%s | HUB",
  description: "HUB - Hệ thống kết nối phụ huynh và nhà trường của Trường Đại học Ngân hàng Thành phố Hồ Chí Minh. Được phát triển bởi P.QLCNTT để tạo cầu nối giữa phụ huynh, gia đình và nhà trường.",
  
  // Application info
  name: "HUB - Phụ huynh",
  namePublic: "Kết nối phụ huynh và nhà trường",
  company: "P.QLCNTT",
  url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  
  // Social media
  social: {
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
  },
  
  // SEO
  keywords: [
    "HUB", 
    "Kết nối phụ huynh và nhà trường", 
    "Đại học Ngân hàng Thành phố Hồ Chí Minh",
    "HUB Phụ huynh",
    "Tra cứu kết quả học tập HUB",
    "Quản trị nội dung", 
    "Admin Panel"
  ] as string[],
  
  // Authors
  authors: [{ name: "P.QLCNTT" }] as Array<{ name: string }>,
  
  // Creator
  creator: "P.QLCNTT",
  
  // Publisher
  publisher: "P.QLCNTT",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "HUB - Phụ huynh",
    title: "HUB - Phụ huynh" as string,
    description: "HUB - Hệ thống kết nối phụ huynh và nhà trường của Trường Đại học Ngân hàng Thành phố Hồ Chí Minh. Được phát triển bởi P.QLCNTT để tạo cầu nối giữa phụ huynh, gia đình và nhà trường.",
    images: [
      {
        url: "https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095355z6676952814172_23a84367b5e409bfcea8b8e95ac6ba4c.jpg",
        width: 1200,
        height: 630,
        alt: "HUB - Kết nối phụ huynh và nhà trường",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image" as const,
    title: "HUB - Phụ huynh" as string,
    description: "HUB - Hệ thống kết nối phụ huynh và nhà trường của Trường Đại học Ngân hàng Thành phố Hồ Chí Minh. Được phát triển bởi P.QLCNTT để tạo cầu nối giữa phụ huynh, gia đình và nhà trường.",
    images: ["https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095355z6676952814172_23a84367b5e409bfcea8b8e95ac6ba4c.jpg"],
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  
  // Viewport
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

export type AppBranding = {
  name: string
  logo: string
  url: string
  description?: string
}

export const getAppBranding = (_options?: {
  roles?: Array<{ name: string }>
  resourceSegment?: string
}): AppBranding => ({
  name: appConfig.name,
  logo: "/logo.png",
  url: appConfig.url,
  description: appConfig.description,
})

export const getOpenGraphConfig = () => appConfig.openGraph
export const getTwitterConfig = () => appConfig.twitter
