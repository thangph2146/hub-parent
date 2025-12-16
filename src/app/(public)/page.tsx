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
    "Trang chủ Trường Đại học Ngân hàng TP.Hồ Chí Minh",
  openGraph: {
    ...appConfig.openGraph,
    title: "Trang chủ - Trường Đại học Ngân hàng TP.HCM",
    description:
      "Trang chủ Trường Đại học Ngân hàng TP.Hồ Chí Minh",
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
    title: "Trang chủ - Trường Đại học Ngân hàng TP.HCM",
    description:
      "Trang chủ Trường Đại học Ngân hàng TP.Hồ Chí Minh",
    images: ["/favicon.ico"],
  },
};

export default async function HomePage() {
  return <Home />;
}
