import type { Metadata } from "next";
import { appConfig } from "@/lib/config";
import { Home } from "@/features/public/home/components";

/**
 * Home Page Metadata
 *
 * Theo Next.js 16 best practices:
 * - Metadata được merge với public layout và root layout
 * - Title phù hợp với trang nội dung công khai
 * - Open Graph và Twitter Card cho social sharing
 */
export const metadata: Metadata = {
  title: {
    absolute: "Trang chủ | Trường Đại học Ngân hàng TP.HCM",
  },
  description:
    "Trang chủ Trường Đại học Ngân hàng TP.Hồ Chí Minh - Trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam",
  openGraph: {
    ...appConfig.openGraph,
    title: "Trang chủ - Trường Đại học Ngân hàng TP.HCM",
    description:
      "Trang chủ Trường Đại học Ngân hàng TP.Hồ Chí Minh - Trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam",
    siteName: "Trường Đại học Ngân hàng TP.HCM",
  },
  twitter: {
    ...appConfig.twitter,
    title: "Trang chủ - Trường Đại học Ngân hàng TP.HCM",
    description:
      "Trang chủ Trường Đại học Ngân hàng TP.Hồ Chí Minh - Trường đại học công lập trực thuộc Ngân hàng Nhà nước Việt Nam",
  },
};

export default async function HomePage() {
  return <Home />;
}
