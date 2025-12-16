import type { Metadata } from "next";
import { PublicHeader } from "@/components/layouts/headers";
import { PublicFooter } from "@/components/layouts/footers";
import { appConfig } from "@/lib/config";

/**
 * Public Layout Metadata
 *
 * Theo Next.js 16 best practices:
 * - Metadata được merge với root layout
 * - Public pages nên được index cho SEO
 * - Open Graph và Twitter Card cho social sharing
 * - Metadata phù hợp với trang nội dung công khai của trường
 * - Favicon được thêm vào metadata
 */
export const metadata: Metadata = {
  title: {
    default: "Trường Đại học Ngân hàng TP.Hồ Chí Minh",
    template: "%s | Trường Đại học Ngân hàng TP.HCM",
  },
  description:
    "Trường Đại học Ngân hàng Thành phố Hồ Chí Minh (HUB) - Trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam, đào tạo nguồn nhân lực chất lượng cao trong lĩnh vực ngân hàng, tài chính và kinh tế.",
  keywords: [
    "Trường Đại học Ngân hàng",
    "HUB",
    "đại học ngân hàng",
    "đào tạo ngân hàng",
    "tài chính",
    "kinh tế",
    "TP.HCM",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    ...appConfig.openGraph,
    title: "Trường Đại học Ngân hàng TP.Hồ Chí Minh",
    description:
      "Trường Đại học Ngân hàng Thành phố Hồ Chí Minh (HUB) - Trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam",
    siteName: "Trường Đại học Ngân hàng TP.HCM",
    images: [
      {
        url: "/favicon.ico",
        width: 32,
        height: 32,
        alt: "Trường Đại học Ngân hàng TP.HCM",
      },
    ],
  },
  twitter: {
    ...appConfig.twitter,
    title: "Trường Đại học Ngân hàng TP.Hồ Chí Minh",
    description:
      "Trường Đại học Ngân hàng Thành phố Hồ Chí Minh (HUB) - Trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam",
    images: ["/favicon.ico"],
  },
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
