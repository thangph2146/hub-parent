import type { Metadata } from "next";
import { PublicHeader } from "@/components/layouts/headers";
import { PublicFooter } from "@/components/layouts/footer";
import { appConfig, getOpenGraphConfig, getTwitterConfig } from "@/lib/config";

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
      <PublicHeader />
      <main id="main-content" className="mb-8">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
