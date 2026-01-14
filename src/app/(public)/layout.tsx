import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/headers";
import { PublicFooter } from "@/components/layout/footer";
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/constants"

/**
 * Public Layout Metadata
 *
 * Theo Next.js 16 best practices:
 * - Metadata được merge với root layout
 * - Public pages nên được index cho SEO
 * - Open Graph và Twitter Card cho social sharing
 * - Metadata phù hợp với trang nội dung công khai của trường
 * - Favicon được thêm vào metadata
 * - Sử dụng appConfig để đảm bảo tính nhất quán
 */
export const metadata: Metadata = {
  title: {
    default: appConfig.titleDefault,
    template: appConfig.titleTemplate,
  },
  description: appConfig.description,
  keywords: appConfig.keywords,
  icons: appConfig.icons,
  // Open Graph và Twitter sẽ được override bởi từng page cụ thể
  // Chỉ set base config ở đây để các page có thể extend
  openGraph: getOpenGraphConfig(),
  twitter: getTwitterConfig(),
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Chuyển đến nội dung chính
      </a>
      <PublicHeader />
      <main id="main-content" className="mb-8 outline-none" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
