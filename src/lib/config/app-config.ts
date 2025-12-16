/**
 * Global application configuration
 * 
 * Theo Next.js 16 best practices:
 * - Metadata configuration cho SEO và social sharing
 * - Open Graph và Twitter Card support
 * - Canonical URLs và robots configuration
 */
import { DEFAULT_ROLES } from "@/lib/permissions"

export const appConfig = {
  // Basic metadata
  titleDefault: "HUB - Kết nối phụ huynh và nhà trường",
  titleTemplate: "%s | HUB",
  description: "HUB - Hệ thống kết nối phụ huynh và nhà trường của Trường Đại học Ngân hàng Thành phố Hồ Chí Minh. Được phát triển bởi P.QLCNTT để tạo cầu nối giữa phụ huynh, gia đình và nhà trường.",
  
  // Application info
  name: "HUB - Phụ huynh",
  namePublic: "Kết nối phụ huynh và nhà trường ",
  company: "P.QLCNTT",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Social media
  social: {
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
  },
  
  // SEO
  keywords: ["HUB", "Kết nối phụ huynh và nhà trường", "Quản trị nội dung", "Admin Panel"] as string[],
  
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
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Verification (nếu có)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
  
  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    // apple: "/apple-icon.png", // Commented out - file không tồn tại
  },
  
  // Manifest
  manifest: "/manifest.json",
  
  // Viewport (được set trong layout, nhưng có thể reference ở đây)
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
} as const

/**
 * Helper function để convert readonly OpenGraph config sang mutable cho Next.js Metadata
 * 
 * Lưu ý: Không include 'url' ở đây vì:
 * - Next.js sẽ tự động resolve relative URLs từ metadataBase
 * - Mỗi page sẽ set URL riêng của nó
 */
export function getOpenGraphConfig() {
  const { url: _unusedUrl, ...rest } = appConfig.openGraph;
  return {
    ...rest,
    images: appConfig.openGraph.images ? [...appConfig.openGraph.images] : undefined,
  }
}

/**
 * Helper function để convert readonly Twitter config sang mutable cho Next.js Metadata
 */
export function getTwitterConfig() {
  return {
    ...appConfig.twitter,
    images: appConfig.twitter.images ? [...appConfig.twitter.images] : undefined,
  }
}

export interface AppBranding {
  name: string
  description: string
}

const ROLE_BRANDING_MAP: Record<string, AppBranding> = {
  [DEFAULT_ROLES.SUPER_ADMIN.name]: {
    name: "HUB Super Admin",
    description: "HUB - Kết nối phụ huynh và nhà trường tối cao - Toàn quyền hệ thống",
  },
  [DEFAULT_ROLES.ADMIN.name]: {
    name: "HUB Admin",
    description: "HUB - Kết nối phụ huynh và nhà trường quản trị viên hệ thống",
  },
  [DEFAULT_ROLES.EDITOR.name]: {
    name: "HUB Biên Tập",
    description: "HUB - Kết nối phụ huynh và nhà trường biên tập và xuất bản nội dung",
  },
  [DEFAULT_ROLES.AUTHOR.name]: {
    name: "HUB Tác Giả",
    description: "HUB - Kết nối phụ huynh và nhà trường tác giả bài viết",
  },
  [DEFAULT_ROLES.USER.name]: {
    name: "HUB Người Dùng",
    description: "HUB - Kết nối phụ huynh và nhà trường người dùng",
  },
  [DEFAULT_ROLES.PARENT.name]: {
    name: "HUB Phụ Huynh",
    description: "HUB - Kết nối phụ huynh và nhà trường quản lý cho phụ huynh",
  },
}

export function getAppBranding({
  roles,
  resourceSegment,
}: {
  roles?: Array<{ name?: string | null }>
  resourceSegment?: string | null
} = {}): AppBranding {
  const fallback: AppBranding = {
    name: appConfig.name,
    description: appConfig.description,
  }

  // Ưu tiên check roles trước (chính xác hơn)
  if (roles && roles.length > 0) {
    for (const role of roles) {
      if (role?.name) {
        const key = role.name.toLowerCase()
        const branding = ROLE_BRANDING_MAP[key]
        if (branding) {
          return branding
        }
      }
    }
  }

  // Nếu không tìm thấy từ roles, thử resourceSegment như fallback
  if (resourceSegment) {
    const key = resourceSegment.toLowerCase()
    const branding = ROLE_BRANDING_MAP[key]
    if (branding) {
      return branding
    }
  }

  return fallback
}

