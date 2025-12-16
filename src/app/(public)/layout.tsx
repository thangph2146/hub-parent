import type { Metadata } from "next";
import { PublicHeader } from "@/components/layouts/headers";
import { PublicFooter } from "@/components/layouts/footers";
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
  description: appConfig.namePublic || appConfig.description,
  keywords: appConfig.keywords,
  icons: appConfig.icons,
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
      {children}
      <PublicFooter />
    </>
  );
}
